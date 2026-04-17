from typing import Optional
from fastapi import Request

# Simple Mock User Model for RBAC Demo instead of full JWT for simplicity in this demo scope.
class User:
    def __init__(self, username: str, role: str):
        self.username = username
        self.role = role

def get_current_user(request: Request) -> User:
    # In a real environment, we decode the JWT token here.
    # For demo purposes, we automatically map users based on a mock header, 
    # defaulting to Admin so the app can be easily demonstrated.
    mock_role = request.headers.get("x-user-role", "Admin")
    return User(username="admin@enterprise.com", role=mock_role)

# Dummy OAuth scheme to appease FastAPI Depends
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
def verify_token():
    pass
