from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from services.parser import parse_file
from services.auth import get_current_user
from database import get_db, User, UserFile
import shutil
import os
import json

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".epub"}
UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="File type not supported. Please upload a PDF, DOCX, or EPUB."
        )

    user_dir = os.path.join(UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_dir, exist_ok=True)
    file_path = os.path.join(user_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    chapters = parse_file(file_path)

    existing = db.query(UserFile).filter(
        UserFile.user_id == current_user.id,
        UserFile.filename == file.filename
    ).first()

    if existing:
        existing.file_path = file_path
        existing.chapters = json.dumps(list(chapters.keys()))
        db.commit()
        db.refresh(existing)
    else:
        user_file = UserFile(
            user_id=current_user.id,
            filename=file.filename,
            file_path=file_path,
            file_type=ext,
            chapters=json.dumps(list(chapters.keys()))
        )
        db.add(user_file)
        db.commit()

    return {
        "filename": file.filename,
        "file_path": file_path,
        "file_type": ext,
        "chapters": list(chapters.keys())
    }

@router.get("/files")
def get_files(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
    f = db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    if os.path.exists(f.file_path):
        os.remove(f.file_path)
    db.delete(f)
    db.commit()
    return {"message": "File deleted"}