from pydantic import BaseModel, EmailStr
from typing import Optional
import sqlite3
import os

try:
    from app.database import get_db_connection
except ImportError:
    from database import get_db_connection

class GoogleLoginRequest(BaseModel):
    token: str
    email: EmailStr
    name: str
    picture: Optional[str] = None

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserSession(BaseModel):
    authenticated: bool
    token: str
    user: dict

def register_user(payload: RegisterRequest) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (payload.email.lower(),))
        if cursor.fetchone():
            return {"success": False, "message": "Email already registered."}
            
        # Insert new user
        cursor.execute(
            "INSERT INTO users (name, email, password, auth_provider, picture) VALUES (?, ?, ?, ?, ?)",
            (payload.name, payload.email.lower(), payload.password, "email", "https://api.dicebear.com/7.x/identicon/svg?seed=" + payload.name.replace(" ", ""))
        )
        conn.commit()
        return {"success": True, "message": "User registered successfully."}
    except Exception as e:
        return {"success": False, "message": f"Database error: {str(e)}"}
    finally:
        conn.close()

def login_user(payload: LoginRequest) -> UserSession:
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT name, email, auth_provider, picture FROM users WHERE email = ? AND password = ?",
            (payload.email.lower(), payload.password)
        )
        row = cursor.fetchone()
        if row:
            return UserSession(
                authenticated=True,
                token=f"jwt_session_{row['email'].split('@')[0]}",
                user={
                    "name": row["name"],
                    "email": row["email"],
                    "picture": row["picture"] or "https://api.dicebear.com/7.x/identicon/svg?seed=" + row["name"].replace(" ", ""),
                    "auth_provider": row["auth_provider"]
                }
            )
        return UserSession(authenticated=False, token="", user={})
    except Exception as e:
        print(f"Login error: {e}")
        return UserSession(authenticated=False, token="", user={})
    finally:
        conn.close()

def verify_google_token(payload: GoogleLoginRequest) -> UserSession:
    # Verifying mock token
    if not payload.token.startswith("mock_google_"):
        return UserSession(authenticated=False, token="", user={})
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if Google user already exists in DB
        cursor.execute("SELECT name, email, auth_provider, picture FROM users WHERE email = ?", (payload.email.lower(),))
        row = cursor.fetchone()
        
        if not row:
            # New user logging in via Google: Register them automatically!
            print(f"Registering new Google user: {payload.name} ({payload.email})")
            cursor.execute(
                "INSERT INTO users (name, email, auth_provider, picture) VALUES (?, ?, ?, ?)",
                (payload.name, payload.email.lower(), "google", payload.picture)
            )
            conn.commit()
            
            # Fetch newly registered user
            cursor.execute("SELECT name, email, auth_provider, picture FROM users WHERE email = ?", (payload.email.lower(),))
            row = cursor.fetchone()
            
        return UserSession(
            authenticated=True,
            token=f"jwt_session_{row['email'].split('@')[0]}",
            user={
                "name": row["name"],
                "email": row["email"],
                "picture": row["picture"] or payload.picture or "https://api.dicebear.com/7.x/identicon/svg?seed=" + row["name"].replace(" ", ""),
                "auth_provider": row["auth_provider"]
            }
        )
    except Exception as e:
        print(f"Google auth error: {e}")
        return UserSession(authenticated=False, token="", user={})
    finally:
        conn.close()
