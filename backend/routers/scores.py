from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Score, User
from services.auth import get_current_user

router = APIRouter(prefix="/scores", tags=["scores"])

class ScoreSubmit(BaseModel):
    """Request model for submitting an exam score"""
    chapter: str
    score: int
    total: int

@router.post("/")
def submit_score(
    request: ScoreSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save an exam score for the current user and chapter"""
    percentage = round((request.score / request.total) * 100, 1)
    new_score = Score(
        user_id=current_user.id,
        user_email=current_user.email,
        username=current_user.username,
        chapter=request.chapter,
        score=request.score,
        total=request.total,
        percentage=percentage
    )
    db.add(new_score)
    db.commit()
    return {"message": "Score saved", "percentage": percentage}

@router.get("/{chapter}")
def get_leaderboard(chapter: str, db: Session = Depends(get_db)):
    """Get top 10 scores for a specific chapter, best score per user"""
    all_scores = db.query(Score).filter(Score.chapter == chapter).all()

    best_scores = {}
    for s in all_scores:
        key = s.username or s.user_email
        if key not in best_scores or s.percentage > best_scores[key].percentage:
            best_scores[key] = s

    sorted_scores = sorted(best_scores.values(), key=lambda x: x.percentage, reverse=True)[:10]

    return [
        {
            "rank": i + 1,
            "username": s.username or s.user_email.split("@")[0],
            "score": s.score,
            "total": s.total,
            "percentage": s.percentage,
            "date": s.created_at
        }
        for i, s in enumerate(sorted_scores)
    ]