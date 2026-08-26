from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from services.parser import parse_file
from services.ai import generate_flashcards, generate_exam
from services.auth import get_current_user, verify_file_ownership
from database import get_db, User
from pydantic import BaseModel

router = APIRouter(prefix="/flashcards", tags=["flashcards"])

class FlashcardRequest(BaseModel):
    """Request model for flashcard generation"""
    file_path: str
    chapter: str
    num_cards: int = 10

class ExamRequest(BaseModel):
    """Request model for exam generation"""
    file_path: str
    chapter: str
    num_questions: int = 10

@router.post("/generate")
async def generate(
    request: FlashcardRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Parse the uploaded file, extract the requested chapter,
    and generate AI flashcards with source quotes.
    """
    verify_file_ownership(request.file_path, current_user, db)
    try:
        chapters = parse_file(request.file_path)
        if request.chapter not in chapters:
            raise HTTPException(status_code=404, detail="Chapter not found")
        chapter_text = chapters[request.chapter]
        flashcards = generate_flashcards(chapter_text, request.num_cards)
        return {
            "chapter": request.chapter,
            "num_cards": len(flashcards),
            "flashcards": flashcards
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/exam")
async def exam(
    request: ExamRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Parse the uploaded file, extract the requested chapter,
    and generate AI multiple choice exam questions.
    """
    verify_file_ownership(request.file_path, current_user, db)
    try:
        chapters = parse_file(request.file_path)
        if request.chapter not in chapters:
            raise HTTPException(status_code=404, detail="Chapter not found")
        chapter_text = chapters[request.chapter]
        questions = generate_exam(chapter_text, request.num_questions)
        return {
            "chapter": request.chapter,
            "num_questions": len(questions),
            "questions": questions
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
