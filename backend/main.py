from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

# local imports
from auth import oauth2_scheme, verify_token, get_current_user, User
from setup_db import get_db
from schema_service import get_schema
from masking_service import get_masked_preview
from llm_service import generate_dq_rules
from dq_engine import evaluate_dq

app = FastAPI(title="Enterprise Data Quality API")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Data Quality Platform API is running"}

@app.get("/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {"user": current_user}

@app.get("/api/schema", tags=["Schema Extraction"])
def fetch_schema(current_user: User = Depends(get_current_user)):
    # In enterprise scenario, get_schema() reads metadata tables
    schema = get_schema()
    return {"schema": schema}

@app.post("/api/mask-preview", tags=["Data Masking"])
def fetch_masked_preview(table_name: str, current_user: User = Depends(get_current_user)):
    # Returns 5 rows of data with PII masked before sending to frontend
    preview = get_masked_preview(table_name)
    return {"table": table_name, "preview": preview}

@app.post("/api/generate-rules", tags=["Business Rules & LLM"])
def generate_rules(table_name: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["Admin", "Data Steward"]:
        raise HTTPException(status_code=403, detail="Not authorized to generate rules")
    
    # 1. Fetch Schema
    schema = get_schema()
    table_schema = next((t for t in schema if t["table_name"] == table_name), None)
    
    if not table_schema:
        raise HTTPException(status_code=404, detail="Table not found")

    # 2. Feed TO Local Gemma model
    rules = generate_dq_rules(table_schema)
    return {"table": table_name, "proposed_rules": rules}

@app.get("/api/dq-evaluation", tags=["DQ Engine"])
def evaluate_quality(table_name: str, current_user: User = Depends(get_current_user)):
    results = evaluate_dq(table_name)
    return {"table": table_name, "dimensions": results}
