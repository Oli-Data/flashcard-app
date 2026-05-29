from fastapi import APIRouter, UploadFile, File, HTTPException
from services.parser import parse_file
import shutil
import os

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".epub"}
UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="File type not supported. Please upload a PDF, DOCX, or EPUB."
        )
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    chapters = parse_file(file_path)
    
    return {
        "filename": file.filename,
        "file_path": file_path,
        "file_type": ext,
        "chapters": list(chapters.keys())
    }