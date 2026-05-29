from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, FlashcardSet, User
from services.auth import get_current_user
import json

router = APIRouter(prefix="/sets", tags=["sets"])

class SaveSetRequest(BaseModel):
    title: str
    chapter: str
    cards: list

@router.post("/save")
def save_set(request: SaveSetRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_set = FlashcardSet(
        user_id=current_user.id,
        title=request.title,
        chapter=request.chapter,
        cards=json.dumps(request.cards)
    )
    db.add(new_set)
    db.commit()
    db.refresh(new_set)
    return {"message": "Set saved", "id": new_set.id}

@router.get("/")
def get_sets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sets = db.query(FlashcardSet).filter(FlashcardSet.user_id == current_user.id).all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "chapter": s.chapter,
            "cards": json.loads(s.cards),
            "created_at": s.created_at
        }
        for s in sets
    ]

@router.delete("/{set_id}")
def delete_set(set_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = db.query(FlashcardSet).filter(FlashcardSet.id == set_id, FlashcardSet.user_id == current_user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Set not found")
    db.delete(s)
    db.commit()
    return {"message": "Set deleted"}