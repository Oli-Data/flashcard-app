import os
import sys
from pathlib import Path

os.environ["SECRET_KEY"] = "test-secret-only-not-for-deployment"
os.environ["ANTHROPIC_API_KEY"] = "test-key-no-network"
os.environ["DATABASE_URL"] = "sqlite://"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base, User, get_db
from main import app
from services.auth import get_current_user
from services import storage
from routers import upload
from game_manager import game_manager


@pytest.fixture
def api(tmp_path, monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    user = User(email="owner@example.test", username="owner", friend_code="LUMI-0001", hashed_password="unused")
    other = User(email="other@example.test", username="other", friend_code="LUMI-0002", hashed_password="unused")
    db.add_all([user, other])
    db.commit()
    monkeypatch.setattr(storage, "UPLOAD_DIR", tmp_path / "uploads")
    monkeypatch.setattr(upload, "UPLOAD_DIR", tmp_path / "uploads")
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: user
    with TestClient(app) as client:
        yield client, db, user, other
    app.dependency_overrides.clear()
    game_manager.rooms.clear()
    db.close()
    engine.dispose()
