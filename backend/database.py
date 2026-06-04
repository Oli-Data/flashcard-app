from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# SQLite database stored locally as a file
SQLALCHEMY_DATABASE_URL = "sqlite:///./flashcards.db"

# Create engine with thread safety for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Session factory for database connections
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    """Stores registered user accounts"""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class FlashcardSet(Base):
    """Stores saved flashcard sets tied to a user"""
    __tablename__ = "flashcard_sets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    title = Column(String)
    chapter = Column(String)
    cards = Column(Text)  # JSON string of flashcard objects
    created_at = Column(DateTime, default=datetime.utcnow)

class UserFile(Base):
    """Stores uploaded textbook file metadata tied to a user"""
    __tablename__ = "user_files"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    filename = Column(String)
    file_path = Column(String)
    file_type = Column(String)
    chapters = Column(Text)  # JSON string of chapter names
    created_at = Column(DateTime, default=datetime.utcnow)

class Score(Base):
    """Stores exam scores per user per chapter"""
    __tablename__ = "scores"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    user_email = Column(String)
    chapter = Column(String, index=True)
    score = Column(Integer)
    total = Column(Integer)
    percentage = Column(Float)
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