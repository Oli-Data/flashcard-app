from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from services.parser import parse_file
from services.auth import get_current_user, verify_file_ownership
from services.storage import UPLOAD_DIR, MAX_UPLOAD_BYTES, user_file_path
from database import get_db, User, UserFile
import os
import json
import logging
from uuid import uuid4

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".epub"}
logger = logging.getLogger(__name__)

@router.post("/")
def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a textbook file (PDF, DOCX, or EPUB).
    Parses chapters and saves file metadata to the database.
    """
    filename = file.filename or ""
    if not filename.strip() or any(c in filename for c in ("/", "\\", "\x00")):
        raise HTTPException(status_code=400, detail="Please use a plain filename without folders.")
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="File type not supported. Please upload a PDF, DOCX, or EPUB."
        )

    # Never use client filenames as storage paths, including on replacement.
    user_dir = UPLOAD_DIR / str(current_user.id)
    file_path = str(user_dir / f"{uuid4().hex}{ext}")
    try:
        destination = user_file_path(file_path, current_user.id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid upload destination.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        size = 0
        with destination.open("xb") as buffer:
            while chunk := file.file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="Files must be 25 MB or smaller.")
                buffer.write(chunk)
        try:
            chapters = parse_file(file_path)
        except Exception:
            raise HTTPException(status_code=422, detail="This document could not be read. Please check the file and try again.")
        if not any(text.strip() for text in chapters.values()):
            raise HTTPException(status_code=422, detail="No readable text was found. Scanned documents need text recognition first.")
    except Exception:
        destination.unlink(missing_ok=True)
        raise

    # Update existing record or create new one
    existing = db.query(UserFile).filter(
        UserFile.user_id == current_user.id,
        UserFile.filename == filename
    ).first()

    old_path = existing.file_path if existing else None
    if existing:
        existing.file_path = file_path
        existing.chapters = json.dumps(list(chapters.keys()))
        existing.file_type = ext
    else:
        user_file = UserFile(
            user_id=current_user.id,
            filename=filename,
            file_path=file_path,
            file_type=ext,
            chapters=json.dumps(list(chapters.keys()))
        )
        db.add(user_file)
    try:
        db.commit()
    except Exception:
        db.rollback()
        destination.unlink(missing_ok=True)
        raise
    if old_path:
        try:
            user_file_path(old_path, current_user.id).unlink(missing_ok=True)
        except (ValueError, OSError):
            logger.warning("Could not remove replaced upload for user %s", current_user.id)

    return {
        "filename": filename,
        "file_path": file_path,
        "file_type": ext,
        "chapters": list(chapters.keys())
    }

@router.get("/files")
def get_files(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve all uploaded files for the current user"""
    files = db.query(UserFile).filter(UserFile.user_id == current_user.id).all()
    return [
        {
            "id": f.id,
            "filename": f.filename,
            "file_path": f.file_path,
            "file_type": f.file_type,
            "chapters": json.loads(f.chapters),
            "created_at": f.created_at
        }
        for f in files
    ]

@router.delete("/files/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a specific uploaded file owned by the current user"""
    f = db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    verify_file_ownership(f.file_path, current_user, db)
    user_file_path(f.file_path, current_user.id).unlink(missing_ok=True)
    db.delete(f)
    db.commit()
    return {"message": "File deleted"}
