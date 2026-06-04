from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, User, generate_friend_code
from services.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

class UserCreate(BaseModel):
    """Request model for user registration"""
    email: str
    username: str
    password: str

class UserLogin(BaseModel):
    """Request model for user login"""
    email: str
    password: str

class Token(BaseModel):
    """Response model containing JWT access token and user info"""
    access_token: str
    token_type: str
    username: str
    friend_code: str

@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account with username and friend code.
    Returns a JWT token on success.
    """
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Generate unique friend code
    friend_code = generate_friend_code()
    while db.query(User).filter(User.friend_code == friend_code).first():
        friend_code = generate_friend_code()

    hashed = hash_password(user.password)
    new_user = User(
        email=user.email,
        username=user.username,
        friend_code=friend_code,
        hashed_password=hashed
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": new_user.username,
        "friend_code": new_user.friend_code
    }

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate an existing user.
    Returns a JWT token and user info on success.
    """
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": db_user.username,
        "friend_code": db_user.friend_code
    }