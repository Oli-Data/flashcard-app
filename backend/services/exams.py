import json
from datetime import datetime

from fastapi import HTTPException

from database import ExamAttempt


def get_attempt(exam_id, user, db):
    attempt = db.query(ExamAttempt).filter(
        ExamAttempt.id == exam_id, ExamAttempt.user_id == user.id
    ).first()
    if attempt is None:
        raise HTTPException(status_code=404, detail="Exam not found.")
    if attempt.expires_at <= datetime.utcnow():
        raise HTTPException(status_code=410, detail="This exam has expired. Please start a new exam.")
    return attempt


def grade(questions, answers):
    return sum(answer == question["correct_index"] for question, answer in zip(questions, answers))


def answer_question(attempt, question_index, answer_index, db):
    questions = json.loads(attempt.questions)
    answers = json.loads(attempt.answers)
    if question_index >= len(questions) or question_index > len(answers):
        raise HTTPException(status_code=409, detail="Please answer questions in order.")
    if question_index < len(answers):
        if answers[question_index] != answer_index:
            raise HTTPException(status_code=409, detail="This answer has already been submitted.")
        # An identical retry after a lost response is safe.
    else:
        previous = attempt.answers
        answers.append(answer_index)
        changed = db.query(ExamAttempt).filter(
            ExamAttempt.id == attempt.id, ExamAttempt.answers == previous,
            ExamAttempt.score_id.is_(None),
        ).update({ExamAttempt.answers: json.dumps(answers)}, synchronize_session=False)
        if changed != 1:
            db.rollback()
            raise HTTPException(status_code=409, detail="The exam changed. Please retry your answer.")
        db.commit()
    correct_index = questions[question_index]["correct_index"]
    return {"correct": answer_index == correct_index, "correct_index": correct_index,
            "score": grade(questions, answers)}
