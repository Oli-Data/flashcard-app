from fastapi import APIRouter, HTTPException
from services.parser import parse_file
from services.ai import generate_flashcards
from pydantic import BaseModel

router = APIRouter(prefix="/flashcards", tags=["flashcards"])

class FlashcardRequest(BaseModel):
    file_path: str
    chapter: str
    num_cards: int = 10

@router.post("/generate")
async def generate(request: FlashcardRequest):
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))