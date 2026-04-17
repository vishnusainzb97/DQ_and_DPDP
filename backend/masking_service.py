import pandas as pd
from setup_db import engine

def get_masked_preview(table_name: str):
    df = pd.read_sql_table(table_name, engine)
    
    # DPDP PII Masking standard
    if "ssn" in df.columns:
        df["ssn"] = "***-**-****"
    if "dob" in df.columns:
        df["dob"] = "****-**-** (MASKED)"
    if "patient_name" in df.columns:
        df["patient_name"] = df["patient_name"].apply(lambda x: x[0] + "***" if isinstance(x, str) else x)
    if "customer_name" in df.columns:
        df["customer_name"] = df["customer_name"].apply(lambda x: x[0] + "***" if isinstance(x, str) else x)
        
    return df.head(5).to_dict(orient="records")
