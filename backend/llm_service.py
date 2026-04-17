import httpx

def generate_dq_rules(table_schema: dict):
    # Constructing prompt without actual PII data, only the schema map
    prompt = f"You are a Data Quality Expert. Analyze this enterprise schema entirely offline and define precise business rules for the 6 standard dimensions of Data Quality.\n\nSchema:\n{table_schema}"
    
    try:
        response = httpx.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "gemma:latest",
                "prompt": prompt,
                "stream": False
            },
            timeout=10.0
        )
        if response.status_code == 200:
            return response.json().get("response", "Gemma failed to parse schema.")
        return f"Error: LLM endpoint returned {response.status_code}"
    except Exception as e:
        # Fallback if docker isn't responding immediately or Gemma isn't pulled yet
        return (
            f"Note: Could not connect to local Gemma Docker on port 11434.\nException: {e}\n\n"
            "--- Fallback AI Rules ---\n"
            "1. Completeness: Ensure non-nullable keys are 100% populated.\n"
            "2. Validity: Flag any SSN lacking proper formatting before DPDP masking."
        )
