import random
from sqlalchemy import create_engine, Column, Integer, String, Boolean, MetaData
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./dq_database.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Simulated Banking Table
class Transaction(Base):
    __tablename__ = "banking_transactions"
    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String, index=True)
    customer_name = Column(String)
    ssn = Column(String) # Highly sensitive - needs masking
    transaction_amount = Column(Integer)
    status = Column(String)
    is_flagged = Column(Boolean, default=False)

# Simulated Healthcare Table
class PatientRecord(Base):
    __tablename__ = "patient_ehr"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, index=True)
    patient_name = Column(String)
    dob = Column(String) # Sensitive
    diagnosis_code = Column(String)
    blood_type = Column(String)
    bill_amount = Column(Integer)

def init_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Populate with synthetic data
    for i in range(10):
        db.add(Transaction(
            account_number=f"ACT-{random.randint(1000, 9999)}",
            customer_name=f"Customer {i}",
            ssn=f"{random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(1000, 9999)}",
            transaction_amount=random.randint(50, 5000),
            status=random.choice(["APPROVED", "PENDING", "FAILED", "NULL"])
        ))
        db.add(PatientRecord(
            patient_id=f"PT-{random.randint(100, 999)}",
            patient_name=f"Patient {i}",
            dob=f"19{random.randint(40, 99)}-0{random.randint(1,9)}-1{random.randint(0,9)}",
            diagnosis_code=random.choice(["A01", "B02", "C03", "NULL_CODE"]),
            blood_type=random.choice(["O+", "A-", "B+", "AB-"]),
            bill_amount=random.randint(500, 25000)
        ))
    db.commit()
    db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    print("Initializing Enterprise Database...")
    init_db()
    print("Database Populated Successfully!")
