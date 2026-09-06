import json
import logging

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from services.parser import parse_file
from services.ai import generate_flashcards, generate_exam, ChapterError, GenerationError
from services.auth import get_current_user, verify_file_ownership
from services.exams import get_attempt, answer_question
from database import get_db, User, ExamAttempt

router = APIRouter(prefix="/flashcards", tags=["flashcards"])
logger = logging.getLogger(__name__)


class FlashcardRequest(BaseModel):
    file_path: str
    chapter: str
    num_cards: int = Field(default=10, ge=1, le=50, strict=True)


class ExamRequest(BaseModel):
    file_path: str
    chapter: str
    num_questions: int = Field(default=10, ge=1, le=50, strict=True)


class AnswerRequest(BaseModel):
    question_index: int = Field(ge=0, strict=True)
    answer_index: int = Field(ge=0, le=3, strict=True)


def chapter_material(request, current_user, db, generator, count):
    verify_file_ownership(request.file_path, current_user, db)
    try:
        chapters = parse_file(request.file_path)
        if request.chapter not in chapters:
            raise HTTPException(status_code=404, detail="Chapter not found")
        return generator(chapters[request.chapter], count)
    except HTTPException:
        raise
    except ChapterError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except GenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Chapter generation failed")
        raise HTTPException(status_code=500, detail="The chapter could not be processed. Please try again.") from exc


@router.post("/generate")
def generate(request: FlashcardRequest, db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    flashcards = chapter_material(request, current_user, db, generate_flashcards, request.num_cards)
    return {"chapter": request.chapter, "num_cards": len(flashcards), "flashcards": flashcards}


@router.post("/exam")
def exam(request: ExamRequest, db: Session = Depends(get_db),
         current_user: User = Depends(get_current_user)):
    questions = chapter_material(request, current_user, db, generate_exam, request.num_questions)
    attempt = ExamAttempt(user_id=current_user.id, chapter=request.chapter, questions=json.dumps(questions))
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return {"exam_id": attempt.id, "chapter": request.chapter, "num_questions": len(questions),
            "questions": [{"question": q["question"], "options": q["options"]} for q in questions]}


@router.post("/exam/{exam_id}/answer")
def answer(exam_id: str, request: AnswerRequest, db: Session = Depends(get_db),
           current_user: User = Depends(get_current_user)):
    return answer_question(get_attempt(exam_id, current_user, db), request.question_index, request.answer_index, db)
