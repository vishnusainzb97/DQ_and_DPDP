"""
Enterprise Data Quality Platform — Main API
Real workflow: Upload data → Extract schema → Mask PII → Call Gemma LLM → Run DQ checks → Return results
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import io
import json
import re
import httpx
import traceback
from datetime import datetime

app = FastAPI(title="DataGuard — Enterprise DQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────── GLOBALS ────────────────
OLLAMA_URL = "http://host.docker.internal:11434"  # If running backend in docker
OLLAMA_URL_LOCAL = "http://localhost:11434"        # If running backend natively
GEMMA_MODEL = "gemma4:e2b"

# Stores the last uploaded dataset in memory for the session
uploaded_data = {}

# ──────────────── PII DETECTION PATTERNS ────────────────
PII_PATTERNS = {
    "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
    "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "phone": r"\b(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
    "aadhaar": r"\b\d{4}\s?\d{4}\s?\d{4}\b",
    "pan": r"\b[A-Z]{5}\d{4}[A-Z]\b",
    "credit_card": r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b",
}

PII_COLUMN_KEYWORDS = [
    "name", "ssn", "social_security", "dob", "date_of_birth", "birth",
    "email", "phone", "mobile", "address", "aadhaar", "aadhar",
    "pan", "passport", "credit_card", "account", "salary", "income",
    "patient", "customer", "beneficiary", "nominee"
]


def detect_pii_columns(df: pd.DataFrame) -> dict:
    """Detect PII columns using column name heuristics + regex on sample data."""
    pii_map = {}
    for col in df.columns:
        col_lower = col.lower().strip()
        # Check column name keywords
        is_pii_name = any(kw in col_lower for kw in PII_COLUMN_KEYWORDS)
        # Check data patterns on first 20 non-null values
        sample_vals = df[col].dropna().head(20).astype(str)
        matched_pattern = None
        for pattern_name, pattern_re in PII_PATTERNS.items():
            if sample_vals.apply(lambda x: bool(re.search(pattern_re, x))).any():
                matched_pattern = pattern_name
                break
        if is_pii_name or matched_pattern:
            pii_map[col] = {
                "keyword_match": is_pii_name,
                "pattern_match": matched_pattern,
                "reason": f"Column name keyword" if is_pii_name else f"Regex: {matched_pattern}"
            }
    return pii_map


def mask_value(val, col_name: str) -> str:
    """Mask a single cell value based on its content type."""
    if pd.isna(val) or str(val).strip() == "":
        return str(val)
    s = str(val)
    col_lower = col_name.lower()
    # SSN
    if re.search(PII_PATTERNS["ssn"], s):
        return "***-**-" + s[-4:]
    # Email
    if re.search(PII_PATTERNS["email"], s):
        parts = s.split("@")
        return parts[0][0] + "***@" + parts[1]
    # Phone
    if re.search(PII_PATTERNS["phone"], s):
        return "****-****-" + s[-4:]
    # Aadhaar
    if re.search(PII_PATTERNS["aadhaar"], s):
        return "XXXX XXXX " + s[-4:]
    # Credit card
    if re.search(PII_PATTERNS["credit_card"], s):
        return "****-****-****-" + s[-4:]
    # Name-like columns - show first char only
    if any(kw in col_lower for kw in ["name", "patient", "customer", "beneficiary"]):
        return s[0] + "***" if len(s) > 0 else s
    # Date/DOB
    if any(kw in col_lower for kw in ["dob", "date_of_birth", "birth"]):
        return "****-**-**"
    # Address
    if "address" in col_lower:
        words = s.split()
        return words[0] + " ***" if words else "***"
    # Generic fallback
    if len(s) > 4:
        return s[:2] + "***" + s[-1:]
    return "***"


def mask_dataframe(df: pd.DataFrame, pii_cols: dict) -> pd.DataFrame:
    """Apply masking to all detected PII columns."""
    masked_df = df.copy()
    for col in pii_cols:
        if col in masked_df.columns:
            masked_df[col] = masked_df[col].apply(lambda v: mask_value(v, col))
    return masked_df


def extract_schema(df: pd.DataFrame) -> list:
    """Extract schema metadata from a dataframe — NO actual data values."""
    schema = []
    for col in df.columns:
        col_info = {
            "column_name": col,
            "dtype": str(df[col].dtype),
            "sample_count": int(df[col].count()),
            "total_rows": len(df),
            "null_count": int(df[col].isnull().sum()),
            "unique_count": int(df[col].nunique()),
        }
        schema.append(col_info)
    return schema


def run_dq_checks(df: pd.DataFrame) -> dict:
    """Run real DQ checks across all 6 dimensions on the actual uploaded data."""
    total_cells = df.size
    total_rows = len(df)
    results = {}

    # 1. COMPLETENESS — percentage of non-null cells
    null_cells = int(df.isnull().sum().sum())
    completeness = round(((total_cells - null_cells) / total_cells) * 100, 2) if total_cells > 0 else 0
    results["Completeness"] = {
        "score": completeness,
        "details": f"{null_cells} null values found across {total_cells} total cells",
        "issues": []
    }
    # Per-column null breakdown
    for col in df.columns:
        nc = int(df[col].isnull().sum())
        if nc > 0:
            results["Completeness"]["issues"].append(f"{col}: {nc} nulls ({round(nc/total_rows*100,1)}%)")

    # 2. VALIDITY — check for format conformance
    validity_issues = []
    valid_cells = 0
    checked_cells = 0
    for col in df.columns:
        col_lower = col.lower()
        series = df[col].dropna()
        if "email" in col_lower:
            checked_cells += len(series)
            valid = series.astype(str).apply(lambda x: bool(re.match(PII_PATTERNS["email"], x)))
            valid_cells += int(valid.sum())
            invalid_count = int((~valid).sum())
            if invalid_count > 0:
                validity_issues.append(f"{col}: {invalid_count} invalid email formats")
        elif "ssn" in col_lower or "social_security" in col_lower:
            checked_cells += len(series)
            valid = series.astype(str).apply(lambda x: bool(re.match(PII_PATTERNS["ssn"], x)))
            valid_cells += int(valid.sum())
            invalid_count = int((~valid).sum())
            if invalid_count > 0:
                validity_issues.append(f"{col}: {invalid_count} invalid SSN formats")
        elif "phone" in col_lower or "mobile" in col_lower:
            checked_cells += len(series)
            valid = series.astype(str).apply(lambda x: bool(re.match(PII_PATTERNS["phone"], x)))
            valid_cells += int(valid.sum())
            invalid_count = int((~valid).sum())
            if invalid_count > 0:
                validity_issues.append(f"{col}: {invalid_count} invalid phone formats")
        elif df[col].dtype in ["int64", "float64"]:
            checked_cells += len(series)
            # Check for negative values in numeric columns (simple validity check)
            negatives = int((series < 0).sum())
            valid_cells += len(series) - negatives
            if negatives > 0:
                validity_issues.append(f"{col}: {negatives} negative values")
        # Check for string "NULL", "N/A", "null" as invalid placeholders
        if series.dtype == object:
            placeholder_nulls = series.astype(str).apply(
                lambda x: x.strip().lower() in ["null", "n/a", "na", "none", "undefined", ""]
            )
            ph_count = int(placeholder_nulls.sum())
            if ph_count > 0:
                validity_issues.append(f"{col}: {ph_count} placeholder null strings (e.g., 'NULL', 'N/A')")

    validity_score = round((valid_cells / checked_cells) * 100, 2) if checked_cells > 0 else 100.0
    results["Validity"] = {
        "score": validity_score,
        "details": f"Checked {checked_cells} cells across format-sensitive columns",
        "issues": validity_issues
    }

    # 3. ACCURACY — check for outliers in numeric columns
    accuracy_issues = []
    numeric_cols = df.select_dtypes(include=["int64", "float64"]).columns
    outlier_count = 0
    total_numeric = 0
    for col in numeric_cols:
        series = df[col].dropna()
        total_numeric += len(series)
        if len(series) > 5:
            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            outliers = int(((series < lower) | (series > upper)).sum())
            outlier_count += outliers
            if outliers > 0:
                accuracy_issues.append(f"{col}: {outliers} outliers (range: {lower:.1f} – {upper:.1f})")
    accuracy_score = round(((total_numeric - outlier_count) / total_numeric) * 100, 2) if total_numeric > 0 else 100.0
    results["Accuracy"] = {
        "score": accuracy_score,
        "details": f"{outlier_count} statistical outliers detected via IQR method",
        "issues": accuracy_issues
    }

    # 4. CONSISTENCY — check for mixed types and inconsistent casing
    consistency_issues = []
    consistent_cols = 0
    for col in df.columns:
        series = df[col].dropna()
        if series.dtype == object:
            unique_vals = series.unique()
            # Check for inconsistent casing
            lower_unique = set(str(v).lower().strip() for v in unique_vals)
            if len(lower_unique) < len(unique_vals):
                diff = len(unique_vals) - len(lower_unique)
                consistency_issues.append(f"{col}: {diff} case-inconsistent variants")
            else:
                consistent_cols += 1
        else:
            consistent_cols += 1
    consistency_score = round((consistent_cols / len(df.columns)) * 100, 2) if len(df.columns) > 0 else 100.0
    results["Consistency"] = {
        "score": consistency_score,
        "details": f"{consistent_cols}/{len(df.columns)} columns are internally consistent",
        "issues": consistency_issues
    }
    
    # 5. TIMELINESS — check for date columns and flag stale data
    timeliness_issues = []
    date_cols_found = 0
    fresh_cols = 0
    for col in df.columns:
        col_lower = col.lower()
        if any(kw in col_lower for kw in ["date", "time", "created", "updated", "timestamp", "dob"]):
            date_cols_found += 1
            try:
                dates = pd.to_datetime(df[col], errors="coerce")
                valid_dates = dates.dropna()
                if len(valid_dates) > 0:
                    max_date = valid_dates.max()
                    days_old = (pd.Timestamp.now() - max_date).days
                    if days_old > 90:
                        timeliness_issues.append(f"{col}: Most recent date is {days_old} days old (stale)")
                    else:
                        fresh_cols += 1
            except Exception:
                pass
    timeliness_score = 100.0
    if date_cols_found > 0:
        timeliness_score = round((fresh_cols / date_cols_found) * 100, 2)
    results["Timeliness"] = {
        "score": timeliness_score,
        "details": f"{date_cols_found} date columns inspected, {fresh_cols} are fresh (<90 days)",
        "issues": timeliness_issues
    }

    # 6. UNIQUENESS — duplicate detection
    dup_rows = int(df.duplicated().sum())
    uniqueness_score = round(((total_rows - dup_rows) / total_rows) * 100, 2) if total_rows > 0 else 100.0
    uniqueness_issues = []
    if dup_rows > 0:
        uniqueness_issues.append(f"{dup_rows} fully duplicate rows detected")
    # Also check per-column uniqueness for ID-like columns
    for col in df.columns:
        col_lower = col.lower()
        if any(kw in col_lower for kw in ["id", "key", "code", "number"]):
            col_dups = int(df[col].dropna().duplicated().sum())
            if col_dups > 0:
                uniqueness_issues.append(f"{col}: {col_dups} duplicate values in identifier column")
    results["Uniqueness"] = {
        "score": uniqueness_score,
        "details": f"{dup_rows} full-row duplicates out of {total_rows} rows",
        "issues": uniqueness_issues
    }

    return results


async def call_gemma(prompt: str) -> str:
    """Call the local Gemma LLM via Ollama API. Returns raw LLM response text."""
    payload = {
        "model": GEMMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": 2048
        }
    }
    async with httpx.AsyncClient(timeout=300.0) as client:
        try:
            resp = await client.post(f"{OLLAMA_URL_LOCAL}/api/generate", json=payload)
            resp.raise_for_status()
            return resp.json().get("response", "No response from model.")
        except httpx.ConnectError:
            # Try Docker internal URL as fallback
            try:
                resp = await client.post(f"{OLLAMA_URL}/api/generate", json=payload)
                resp.raise_for_status()
                return resp.json().get("response", "No response from model.")
            except Exception as e2:
                return f"ERROR: Cannot connect to Gemma LLM at either localhost:11434 or host.docker.internal:11434. Exception: {str(e2)}"
        except Exception as e:
            return f"ERROR: LLM call failed — {str(e)}"


# ──────────────── API ENDPOINTS ────────────────

@app.get("/")
def health():
    return {"status": "running", "service": "DataGuard Enterprise DQ API", "timestamp": str(datetime.now())}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a CSV or Excel file. Returns schema + PII detection immediately."""
    global uploaded_data

    try:
        contents = await file.read()
        filename = file.filename.lower()

        # Parse the file
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Only CSV and Excel (.xlsx/.xls) files supported.")

        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # Store in memory for subsequent API calls
        uploaded_data["df"] = df
        uploaded_data["filename"] = file.filename

        # 1. Extract schema
        schema = extract_schema(df)
        uploaded_data["schema"] = schema

        # 2. Detect PII columns
        pii_columns = detect_pii_columns(df)
        uploaded_data["pii_columns"] = pii_columns

        # 4. Generate masked preview (Replace NaNs with empty string for JSON compliance)
        masked_df = mask_dataframe(df, pii_columns)
        masked_preview = masked_df.head(10).fillna("").to_dict(orient="records")

        return {
            "filename": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "schema": schema,
            "pii_columns": pii_columns,
            "masked_preview": masked_preview,
            "privacy_note": "Only schema metadata was sent to the LLM. Zero actual data values were transmitted."
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@app.get("/api/run-dq")
async def run_dq():
    """Run all 6 DQ dimension checks on the already uploaded data."""
    global uploaded_data
    if "df" not in uploaded_data:
        raise HTTPException(status_code=400, detail="No dataset uploaded.")
    
    try:
        df = uploaded_data["df"]
        dq_results = run_dq_checks(df)
        uploaded_data["dq_results"] = dq_results
        return {"dq_results": dq_results}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"DQ Engine error: {str(e)}")


@app.get("/api/generate-rules")
async def generate_rules():
    """Call Gemma LLM with ONLY schema metadata."""
    global uploaded_data
    if "schema" not in uploaded_data or "pii_columns" not in uploaded_data:
        raise HTTPException(status_code=400, detail="No dataset uploaded or schema missing.")

    try:
        df = uploaded_data["df"]
        schema = uploaded_data["schema"]
        pii_columns = uploaded_data["pii_columns"]
        filename = uploaded_data["filename"]

        schema_text = json.dumps(schema, indent=2)
        pii_text = json.dumps({k: v["reason"] for k, v in pii_columns.items()}, indent=2)

        llm_prompt = f"""You are a senior Data Quality Engineer. Analyze the following dataset schema and generate specific, actionable business rules for data quality enforcement. 

IMPORTANT: You are receiving ONLY the schema metadata (column names, types, null counts). You do NOT have access to actual data values. This is by design for DPDP (Digital Personal Data Protection) compliance.

Dataset: {filename}
Total Rows: {len(df)}
Total Columns: {len(df.columns)}

Schema:
{schema_text}

Detected PII Columns:
{pii_text}

For each of the 6 Data Quality Dimensions (Completeness, Validity, Accuracy, Consistency, Timeliness, Uniqueness), generate 1-2 specific business rules that should be enforced on this dataset. Format each rule clearly with the dimension name, rule description, and the columns it applies to."""

        llm_response = await call_gemma(llm_prompt)
        uploaded_data["llm_rules"] = llm_response

        return {"llm_rules": llm_response}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"LLM Generation error: {str(e)}")


@app.get("/api/llm-health")
async def check_llm():
    """Check if the local Gemma LLM is reachable."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{OLLAMA_URL_LOCAL}/api/tags")
            models = resp.json().get("models", [])
            model_names = [m.get("name", "") for m in models]
            return {"status": "online", "models": model_names, "target": GEMMA_MODEL}
    except Exception as e:
        return {"status": "offline", "error": str(e)}


# ──────────────── CLEANING & TRANSFORMATION ENGINE ────────────────

def clean_completeness(df: pd.DataFrame, log: list) -> pd.DataFrame:
    """Fill nulls: numeric → median, string → 'MISSING'. Drop rows with >50% nulls."""
    rows_before = len(df)
    # Drop rows where more than 50% of columns are null
    threshold = len(df.columns) * 0.5
    df = df.dropna(thresh=int(len(df.columns) - threshold + 1))
    dropped = rows_before - len(df)
    if dropped > 0:
        log.append({"dimension": "Completeness", "action": f"Dropped {dropped} rows with >50% null values", "icon": "🗑️", "count": dropped})

    # Fill remaining nulls
    filled_counts = {}
    for col in df.columns:
        null_count = int(df[col].isnull().sum())
        if null_count > 0:
            if df[col].dtype in ["int64", "float64"]:
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val)
                filled_counts[col] = {"count": null_count, "method": f"median ({median_val:.2f})"}
            else:
                df[col] = df[col].fillna("MISSING")
                filled_counts[col] = {"count": null_count, "method": "string 'MISSING'"}
    
    total_filled = sum(v["count"] for v in filled_counts.values())
    if total_filled > 0:
        details = ", ".join([f"{k}: {v['count']} ({v['method']})" for k, v in filled_counts.items()])
        log.append({"dimension": "Completeness", "action": f"Filled {total_filled} null values — {details}", "icon": "✅", "count": total_filled})
    
    return df


def clean_validity(df: pd.DataFrame, log: list) -> pd.DataFrame:
    """Replace placeholder strings with NaN, then fill. Standardize known formats."""
    placeholder_count = 0
    for col in df.columns:
        if df[col].dtype == object:
            mask = df[col].astype(str).str.strip().str.lower().isin(["null", "n/a", "na", "none", "undefined", ""])
            count = int(mask.sum())
            if count > 0:
                df.loc[mask, col] = np.nan
                placeholder_count += count
    
    if placeholder_count > 0:
        log.append({"dimension": "Validity", "action": f"Replaced {placeholder_count} placeholder strings ('NULL', 'N/A', etc.) with proper null", "icon": "🔍", "count": placeholder_count})
        # Re-fill the newly created nulls
        for col in df.columns:
            if df[col].isnull().any():
                if df[col].dtype in ["int64", "float64"]:
                    df[col] = df[col].fillna(df[col].median())
                else:
                    df[col] = df[col].fillna("MISSING")

    return df


def clean_accuracy(df: pd.DataFrame, log: list) -> pd.DataFrame:
    """Cap outliers using IQR winsorization for numeric columns."""
    capped_total = 0
    for col in df.select_dtypes(include=["int64", "float64"]).columns:
        series = df[col].dropna()
        if len(series) > 5:
            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            outlier_mask = (df[col] < lower) | (df[col] > upper)
            count = int(outlier_mask.sum())
            if count > 0:
                df[col] = df[col].clip(lower=lower, upper=upper)
                capped_total += count
                log.append({"dimension": "Accuracy", "action": f"{col}: Capped {count} outliers to [{lower:.1f}, {upper:.1f}]", "icon": "🎯", "count": count})

    if capped_total == 0:
        log.append({"dimension": "Accuracy", "action": "No outliers detected — data values within expected ranges", "icon": "🎯", "count": 0})

    return df


def clean_consistency(df: pd.DataFrame, log: list) -> pd.DataFrame:
    """Normalize casing: title-case for name-like cols, lowercase for emails, strip whitespace everywhere."""
    stripped_count = 0
    case_fixed_count = 0

    for col in df.columns:
        if df[col].dtype == object:
            # Strip whitespace
            original = df[col].copy()
            df[col] = df[col].astype(str).str.strip()
            stripped = int((original.astype(str) != df[col]).sum())
            stripped_count += stripped

            col_lower = col.lower()
            # Title-case for name-like columns
            if any(kw in col_lower for kw in ["name", "patient", "customer", "beneficiary", "city", "state", "country"]):
                before = df[col].copy()
                df[col] = df[col].str.title()
                changed = int((before != df[col]).sum())
                case_fixed_count += changed
            # Lowercase for emails
            elif "email" in col_lower:
                before = df[col].copy()
                df[col] = df[col].str.lower()
                changed = int((before != df[col]).sum())
                case_fixed_count += changed
            # Uppercase for codes/IDs
            elif any(kw in col_lower for kw in ["code", "pan", "status"]):
                before = df[col].copy()
                df[col] = df[col].str.upper()
                changed = int((before != df[col]).sum())
                case_fixed_count += changed

    if stripped_count > 0:
        log.append({"dimension": "Consistency", "action": f"Stripped whitespace from {stripped_count} cells", "icon": "🔗", "count": stripped_count})
    if case_fixed_count > 0:
        log.append({"dimension": "Consistency", "action": f"Standardized casing in {case_fixed_count} cells (title/lower/upper)", "icon": "🔗", "count": case_fixed_count})

    return df


def clean_timeliness(df: pd.DataFrame, log: list) -> pd.DataFrame:
    """Flag stale records with a new column."""
    flagged = 0
    for col in df.columns:
        col_lower = col.lower()
        if any(kw in col_lower for kw in ["date", "time", "created", "updated", "timestamp"]):
            try:
                dates = pd.to_datetime(df[col], errors="coerce")
                stale_mask = (pd.Timestamp.now() - dates).dt.days > 90
                valid_stale = stale_mask.fillna(False)
                count = int(valid_stale.sum())
                if count > 0:
                    flag_col = f"{col}_stale_flag"
                    df[flag_col] = valid_stale.map({True: "STALE", False: "FRESH"})
                    flagged += count
                    log.append({"dimension": "Timeliness", "action": f"Flagged {count} stale records in '{col}' (>90 days old) → new column '{flag_col}'", "icon": "⏱️", "count": count})
            except Exception:
                pass

    if flagged == 0:
        log.append({"dimension": "Timeliness", "action": "No stale date records detected or no date columns found", "icon": "⏱️", "count": 0})

    return df


def clean_uniqueness(df: pd.DataFrame, log: list) -> pd.DataFrame:
    """Remove exact duplicate rows."""
    dup_count = int(df.duplicated().sum())
    if dup_count > 0:
        df = df.drop_duplicates()
        log.append({"dimension": "Uniqueness", "action": f"Removed {dup_count} exact duplicate rows", "icon": "🔑", "count": dup_count})
    else:
        log.append({"dimension": "Uniqueness", "action": "No duplicate rows found — dataset is unique", "icon": "🔑", "count": 0})
    return df


@app.post("/api/clean-transform")
async def clean_transform():
    """Run the full cleaning & transformation pipeline aligned with 6 DQ dimensions + PII masking."""
    global uploaded_data
    if "df" not in uploaded_data:
        raise HTTPException(status_code=400, detail="No dataset uploaded. Please upload a file first.")

    try:
        df = uploaded_data["df"].copy()
        pii_columns = uploaded_data.get("pii_columns", {})

        rows_before = len(df)
        cols_before = len(df.columns)
        nulls_before = int(df.isnull().sum().sum())
        dups_before = int(df.duplicated().sum())

        transformation_log = []

        # Apply all 6 dimension transformations
        df = clean_uniqueness(df, transformation_log)      # 6. Uniqueness first (removes rows)
        df = clean_completeness(df, transformation_log)     # 1. Completeness
        df = clean_validity(df, transformation_log)         # 2. Validity
        df = clean_accuracy(df, transformation_log)         # 3. Accuracy
        df = clean_consistency(df, transformation_log)      # 4. Consistency
        df = clean_timeliness(df, transformation_log)       # 5. Timeliness

        # Apply PII masking as the final step
        masked_df = mask_dataframe(df, pii_columns)
        pii_cols_masked = len(pii_columns)
        if pii_cols_masked > 0:
            transformation_log.append({
                "dimension": "PII Masking",
                "action": f"Applied DPDP-compliant masking to {pii_cols_masked} PII columns: {', '.join(pii_columns.keys())}",
                "icon": "🛡️",
                "count": pii_cols_masked
            })

        rows_after = len(masked_df)
        cols_after = len(masked_df.columns)
        nulls_after = int(df.isnull().sum().sum())  # Check on unmasked df for accuracy

        # Store cleaned data for export
        uploaded_data["cleaned_df"] = df            # Cleaned but unmasked (for internal use)
        uploaded_data["cleaned_masked_df"] = masked_df  # Cleaned + masked (for export)
        uploaded_data["transformation_log"] = transformation_log

        # Generate the cleaned preview (masked)
        cleaned_preview = masked_df.head(15).fillna("").to_dict(orient="records")

        return {
            "transformation_log": transformation_log,
            "cleaned_preview": cleaned_preview,
            "before_after": {
                "rows_before": rows_before,
                "rows_after": rows_after,
                "rows_removed": rows_before - rows_after,
                "cols_before": cols_before,
                "cols_after": cols_after,
                "cols_added": cols_after - cols_before,
                "nulls_before": nulls_before,
                "nulls_after": nulls_after,
                "nulls_fixed": nulls_before - nulls_after,
                "duplicates_removed": dups_before,
                "pii_columns_masked": pii_cols_masked,
                "total_transformations": len(transformation_log)
            }
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Cleaning pipeline error: {str(e)}")


@app.get("/api/export")
async def export_cleaned(format: str = "xlsx"):
    """Export the cleaned & masked dataset as Excel or CSV file."""
    global uploaded_data
    if "cleaned_masked_df" not in uploaded_data:
        raise HTTPException(status_code=400, detail="No cleaned data available. Run the cleaning pipeline first.")

    try:
        df = uploaded_data["cleaned_masked_df"]
        filename_base = uploaded_data.get("filename", "cleaned_data").rsplit(".", 1)[0]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        if format.lower() == "csv":
            buffer = io.StringIO()
            df.to_csv(buffer, index=False)
            buffer.seek(0)
            return StreamingResponse(
                iter([buffer.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename_base}_cleaned_{timestamp}.csv"}
            )
        else:
            buffer = io.BytesIO()
            df.to_excel(buffer, index=False, engine="openpyxl")
            buffer.seek(0)
            return StreamingResponse(
                buffer,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename={filename_base}_cleaned_{timestamp}.xlsx"}
            )

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Export error: {str(e)}")

