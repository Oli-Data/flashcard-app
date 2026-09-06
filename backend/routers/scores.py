from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from database import get_db, Score, User, ExamAttempt
from services.auth import get_current_user
from services.exams import get_attempt, grade
import json

router = APIRouter(prefix="/scores", tags=["scores"])

class ScoreSubmit(BaseModel):
    """Only a completed server-held attempt identifies a score."""
    model_config = ConfigDict(extra="forbid")
    exam_id: str

@router.post("/")
def submit_score(
    request: ScoreSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save an exam score for the current user and chapter"""
    attempt = get_attempt(request.exam_id, current_user, db)
    questions, answers = json.loads(attempt.questions), json.loads(attempt.answers)
    if not questions or len(answers) != len(questions):
        raise HTTPException(status_code=409, detail="Please finish the exam before submitting a score.")
    score, total = grade(questions, answers), len(questions)
    percentage = round(score / total * 100, 1)
    result = {"message": "Score saved", "percentage": percentage, "score": score, "total": total}
    if attempt.score_id is not None:
        return result
    new_score = Score(
        user_id=current_user.id,
        user_email=current_user.email,
        username=current_user.username,
        chapter=attempt.chapter,
        score=score,
        total=total,
        percentage=percentage
    )
    db.add(new_score)
    db.flush()
    changed = db.query(ExamAttempt).filter(
        ExamAttempt.id == attempt.id, ExamAttempt.score_id.is_(None)
    ).update({ExamAttempt.score_id: new_score.id}, synchronize_session=False)
    if changed != 1:
        db.rollback()
        return result
    db.commit()
    return result

@router.get("/{chapter}")
def get_leaderboard(chapter: str, db: Session = Depends(get_db)):
    """Get top 10 scores for a specific chapter, best score per user"""
    # Retain historical client-submitted totals, but rank only verified attempts.
    all_scores = db.query(Score).join(ExamAttempt, ExamAttempt.score_id == Score.id).filter(Score.chapter == chapter).all()

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
