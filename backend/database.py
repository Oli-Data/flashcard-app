from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import random
import string

SQLALCHEMY_DATABASE_URL = "sqlite:///./flashcards_v2.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def generate_friend_code():
    """Generate a unique 4 digit friend code like LUMI-4829"""
    digits = ''.join(random.choices(string.digits, k=4))
    return f"LUMI-{digits}"

class User(Base):
    """Stores registered user accounts"""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    friend_code = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class FlashcardSet(Base):
    """Stores saved flashcard sets tied to a user"""
    __tablename__ = "flashcard_sets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    title = Column(String)
    chapter = Column(String)
    cards = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserFile(Base):
    """Stores uploaded textbook file metadata tied to a user"""
    __tablename__ = "user_files"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    filename = Column(String)
    file_path = Column(String)
    file_type = Column(String)
    chapters = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class Score(Base):
    """Stores exam scores per user per chapter"""
    __tablename__ = "scores"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    user_email = Column(String)
    username = Column(String)
    chapter = Column(String, index=True)
    score = Column(Integer)
    total = Column(Integer)
    percentage = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class Friendship(Base):
    """Stores friend relationships between users"""
    __tablename__ = "friendships"
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, index=True)
    receiver_id = Column(Integer, index=True)
    requester_email = Column(String)
    receiver_email = Column(String)
    requester_username = Column(String)
    receiver_username = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

def get_db():
    """Dependency that provides a database session and closes it after use"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create all database tables if they don't exist"""
    Base.metadata.create_all(bind=engine)