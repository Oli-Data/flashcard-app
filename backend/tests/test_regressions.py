import asyncio
import copy
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import fitz
import pytest
from database import UserFile, ExamAttempt, Score
from game_manager import GameRoom, game_manager
from routers import flashcards, game, upload
from services import ai, storage
from services.auth import get_current_user, create_access_token
from services.parser import parse_pdf
from main import app

QUESTIONS = [
    {"question": "First?", "options": ["a", "b", "c", "d"], "correct_index": 1},
    {"question": "Second?", "options": ["a", "b", "c", "d"], "correct_index": 2},
]


def pdf_bytes(toc=None):
    with fitz.open() as doc:
        for i in range(5):
            doc.new_page().insert_text((72, 72), f"Content on page {i+1}")
        if toc:
            doc.set_toc(toc)
        return doc.tobytes()


def owned_file(db, user):
    directory = storage.UPLOAD_DIR / str(user.id)
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / "book.pdf"
    path.write_bytes(pdf_bytes())
    record = UserFile(user_id=user.id, filename="book.pdf", file_path=str(path), file_type=".pdf", chapters='["Pages 1-5"]')
    db.add(record)
    db.commit()
    return record


def start_exam(api, monkeypatch):
    client, db, user, other = api
    record = owned_file(db, user)
    monkeypatch.setattr(flashcards, "generate_exam", lambda *_: copy.deepcopy(QUESTIONS))
    response = client.post("/flashcards/exam", json={"file_path": record.file_path, "chapter": "Pages 1-5", "num_questions": 2})
    assert response.status_code == 200, response.text
    assert all("correct_index" not in q for q in response.json()["questions"])
    return response.json()["exam_id"]


def test_nested_pdf_chapters_keep_subsection_pages(tmp_path):
    path = tmp_path / "nested.pdf"
    path.write_bytes(pdf_bytes([[1, "Chapter 1", 1], [2, "Section", 2], [1, "Chapter 2", 4]]))
    chapters = parse_pdf(str(path))
    assert "page 2" in chapters["Chapter 1"] and "page 3" in chapters["Chapter 1"]
    assert "page 4" not in chapters["Chapter 1"]
    assert "page 5" in chapters["Chapter 2"]


def test_pdf_without_toc_and_duplicate_titles(tmp_path):
    path = tmp_path / "book.pdf"
    path.write_bytes(pdf_bytes())
    assert "page 5" in parse_pdf(str(path))["Pages 1-5"]
    path.write_bytes(pdf_bytes([[1, "Chapter", 1], [1, "Chapter", 4]]))
    assert len(parse_pdf(str(path))) == 2


@pytest.mark.parametrize("name", ["../2/book.pdf", "/tmp/book.pdf", "..\\2\\book.pdf"])
def test_upload_rejects_path_names(api, name):
    client, *_ = api
    response = client.post("/upload/", files={"file": (name, pdf_bytes(), "application/pdf")})
    assert response.status_code == 400
    assert not storage.UPLOAD_DIR.exists()


def test_upload_replacement_and_failed_parse_preserve_old_file(api):
    client, db, user, _ = api
    first = client.post("/upload/", files={"file": ("book.pdf", pdf_bytes(), "application/pdf")})
    assert first.status_code == 200
    old = Path(first.json()["file_path"])
    assert old.name != "book.pdf" and old.exists()
    bad = client.post("/upload/", files={"file": ("book.pdf", b"broken", "application/pdf")})
    assert bad.status_code == 422 and old.exists()
    second = client.post("/upload/", files={"file": ("book.pdf", pdf_bytes(), "application/pdf")})
    assert second.status_code == 200 and not old.exists()
    assert db.query(UserFile).count() == 1
    assert len(list((storage.UPLOAD_DIR / str(user.id)).iterdir())) == 1


def test_large_upload_is_removed(api, monkeypatch):
    monkeypatch.setattr(upload, "MAX_UPLOAD_BYTES", 10)
    response = api[0].post("/upload/", files={"file": ("book.pdf", pdf_bytes(), "application/pdf")})
    assert response.status_code == 413
    assert not list(storage.UPLOAD_DIR.rglob("*.pdf"))


def test_failed_database_commit_removes_new_upload(api, monkeypatch):
    client, db, *_ = api
    monkeypatch.setattr(db, "commit", MagicMock(side_effect=RuntimeError("database unavailable")))
    with pytest.raises(RuntimeError, match="database unavailable"):
        client.post("/upload/", files={"file": ("book.pdf", pdf_bytes(), "application/pdf")})
    assert not list(storage.UPLOAD_DIR.rglob("*.pdf"))


def test_all_generation_routes_enforce_owner(api, monkeypatch):
    client, db, user, other = api
    record = owned_file(db, other)
    forbidden_generator = MagicMock(side_effect=AssertionError("must not call AI"))
    monkeypatch.setattr(flashcards, "generate_exam", forbidden_generator)
    monkeypatch.setattr(game, "generate_exam", forbidden_generator)
    code = game_manager.create_room(user.username, copy.deepcopy(QUESTIONS))
    payload = {"file_path": record.file_path, "chapter": "Pages 1-5"}
    for route in ["/flashcards/generate", "/flashcards/exam", "/game/create", f"/game/{code}/update-questions"]:
        assert client.post(route, json=payload).status_code == 403
    forbidden_generator.assert_not_called()


def test_legacy_record_cannot_escape_upload_root(api):
    client, db, user, _ = api
    record = UserFile(user_id=user.id, filename="bad.pdf", file_path="/tmp/bad.pdf", chapters="[]")
    db.add(record)
    db.commit()
    assert client.post("/flashcards/generate", json={"file_path": record.file_path, "chapter": "x"}).status_code == 403
    assert client.delete(f"/upload/files/{record.id}").status_code == 403


@pytest.mark.parametrize("count", [0, -1, 51, True, "10"])
def test_generation_count_is_bounded(api, count):
    assert api[0].post("/flashcards/exam", json={"file_path": "x", "chapter": "x", "num_questions": count}).status_code == 422


def test_exam_is_server_graded_and_submission_is_idempotent(api, monkeypatch):
    client, db, *_ = api
    exam_id = start_exam(api, monkeypatch)
    assert client.post("/scores/", json={"chapter": "x", "score": 100, "total": 0}).status_code == 422
    assert client.post("/scores/", json={"exam_id": exam_id}).status_code == 409
    route = f"/flashcards/exam/{exam_id}/answer"
    assert client.post(route, json={"question_index": 1, "answer_index": 2}).status_code == 409
    first = client.post(route, json={"question_index": 0, "answer_index": 0})
    assert first.json() == {"correct": False, "correct_index": 1, "score": 0}
    assert client.post(route, json={"question_index": 0, "answer_index": 1}).status_code == 409
    assert client.post(route, json={"question_index": 0, "answer_index": 0}).json() == first.json()
    assert client.post(route, json={"question_index": 1, "answer_index": 2}).json()["score"] == 1
    for _ in range(2):
        response = client.post("/scores/", json={"exam_id": exam_id})
        assert response.json()["score"] == 1 and response.json()["percentage"] == 50
    assert db.query(Score).count() == 1
    assert client.get("/scores/Pages%201-5").json()[0]["percentage"] == 50


def test_attempt_ownership_expiry_and_legacy_leaderboard(api, monkeypatch):
    client, db, user, other = api
    exam_id = start_exam(api, monkeypatch)
    app.dependency_overrides[get_current_user] = lambda: other
    assert client.post(f"/flashcards/exam/{exam_id}/answer", json={"question_index": 0, "answer_index": 1}).status_code == 404
    assert client.post("/scores/", json={"exam_id": exam_id}).status_code == 404
    app.dependency_overrides[get_current_user] = lambda: user
    attempt = db.get(ExamAttempt, exam_id)
    attempt.expires_at = datetime.utcnow() - timedelta(seconds=1)
    db.add(Score(user_id=user.id, username=user.username, chapter="Pages 1-5", score=100, total=1, percentage=10000))
    db.commit()
    assert client.post(f"/flashcards/exam/{exam_id}/answer", json={"question_index": 0, "answer_index": 1}).status_code == 410
    assert client.get("/scores/Pages%201-5").json() == []


def provider(monkeypatch, payload, stop_reason="end_turn"):
    response = SimpleNamespace(content=[SimpleNamespace(type="text", text=payload)], stop_reason=stop_reason)
    call = MagicMock(return_value=response)
    client = MagicMock()
    client.__enter__.return_value.messages.create = call
    monkeypatch.setattr(ai.anthropic, "Anthropic", MagicMock(return_value=client))
    return call


def test_generation_includes_end_of_chapter_and_validates_quote(monkeypatch):
    chapter = "Opening. " * 1500 + "The final concept is gravity."
    card = {"question": "Final concept?", "answer": "Gravity", "source_quote": "The final concept is gravity."}
    call = provider(monkeypatch, json.dumps([card]))
    assert ai.generate_flashcards(chapter, 1) == [card]
    assert call.call_args.kwargs["messages"][0]["content"] == chapter
    card["source_quote"] = "An invented quote"
    provider(monkeypatch, json.dumps([card]))
    with pytest.raises(ai.GenerationError, match="source quote"):
        ai.generate_flashcards(chapter, 1)


@pytest.mark.parametrize("payload", ["not JSON", "{}", '[{"question":"x"}]', json.dumps([dict(QUESTIONS[0], correct_index=4)]), json.dumps([dict(QUESTIONS[0], options=["a", "a", "c", "d"])])])
def test_invalid_ai_exam_responses_are_rejected(monkeypatch, payload):
    provider(monkeypatch, payload)
    with pytest.raises(ai.GenerationError):
        ai.generate_exam("Chapter text", 1)


def test_ai_truncation_count_and_chapter_limits(monkeypatch):
    call = provider(monkeypatch, json.dumps(QUESTIONS), "max_tokens")
    with pytest.raises(ai.GenerationError, match="incomplete"):
        ai.generate_exam("Chapter text", 2)
    provider(monkeypatch, json.dumps(QUESTIONS))
    with pytest.raises(ai.GenerationError, match="count"):
        ai.generate_exam("Chapter text", 1)
    for source in [" ", "x" * (ai.MAX_CHAPTER_CHARS + 1)]:
        with pytest.raises(ai.ChapterError):
            ai.generate_exam(source, 1)


def test_generation_errors_are_actionable(api, monkeypatch):
    client, db, user, _ = api
    record = owned_file(db, user)
    monkeypatch.setattr(flashcards, "generate_flashcards", MagicMock(side_effect=ai.ChapterError("Choose a shorter chapter.")))
    response = client.post("/flashcards/generate", json={"file_path": record.file_path, "chapter": "Pages 1-5"})
    assert response.status_code == 422 and response.json()["detail"] == "Choose a shorter chapter."


def test_game_uses_server_time_and_rejects_late_or_duplicate_answers(monkeypatch):
    room = GameRoom("CODE", "owner", copy.deepcopy(QUESTIONS))
    socket = SimpleNamespace(send_json=AsyncMock())
    room.add_player("owner", socket)
    room.state, room.question_id, room.question_start_time = "question", "round-one", 100
    monkeypatch.setattr(game.time, "monotonic", lambda: 110)
    asyncio.run(game.handle_answer(room, "owner", 1, "wrong-round"))
    assert not room.players["owner"].answered
    asyncio.run(game.handle_answer(room, "owner", 1, "round-one"))
    assert room.players["owner"].score == 750
    asyncio.run(game.handle_answer(room, "owner", 1, "round-one"))
    assert room.players["owner"].score == 750
    room.reset_answers()
    room.state = "results"
    asyncio.run(game.handle_answer(room, "owner", 1, "round-one"))
    assert not room.players["owner"].answered
    room.state = "question"
    monkeypatch.setattr(game.time, "monotonic", lambda: 121)
    asyncio.run(game.handle_answer(room, "owner", 1, "round-one"))
    assert not room.players["owner"].answered


def test_saved_game_questions_use_real_shuffled_answers(api):
    client, _, user, _ = api
    code = game_manager.create_room(user.username, copy.deepcopy(QUESTIONS))
    cards = [{"question": f"Question {i}?", "answer": f"Answer {i}"} for i in range(4)]
    assert client.post(f"/game/{code}/update-questions", json={"cards": cards}).status_code == 200
    room = game_manager.get_room(code)
    for q, card in zip(room.questions, cards):
        assert q["options"][q["correct_index"]] == card["answer"]
        assert len(set(q["options"])) == 4
    room.state = "question"
    assert client.post(f"/game/{code}/update-questions", json={"cards": cards}).status_code == 409


def test_websocket_rejects_impersonation_and_duplicate_start(api, monkeypatch):
    client, _, user, _ = api
    code = game_manager.create_room(user.username, copy.deepcopy(QUESTIONS))
    with client.websocket_connect(f"/game/ws/{code}/owner?token=invalid") as ws:
        assert ws.receive_json()["type"] == "error"
    token = create_access_token({"sub": user.email})
    calls = []
    async def fake_loop(room):
        calls.append(room)
        await asyncio.sleep(60)
    monkeypatch.setattr(game, "start_game_loop", fake_loop)
    with client.websocket_connect(f"/game/ws/{code}/owner?token={token}") as ws:
        assert ws.receive_json()["type"] == "player_joined"
        ws.send_json({"type": "start_game"})
        ws.send_json({"type": "start_game"})
        ws.send_json({"type": "ping"})
        assert ws.receive_json()["type"] == "pong"
        assert len(calls) == 1


def test_game_finishes_and_can_restart_without_accepting_old_answers(monkeypatch):
    room = GameRoom("CODE", "owner", copy.deepcopy(QUESTIONS))
    room.add_player("owner", SimpleNamespace(send_json=AsyncMock()))
    rounds, final_scores = [], []
    async def broadcast(message):
        if message["type"] == "question":
            rounds.append(message["question_id"])
            answer = room.questions[message["index"]]["correct_index"]
            await game.handle_answer(room, "owner", answer, message["question_id"])
        elif message["type"] == "game_over":
            final_scores.append(message["leaderboard"][0]["score"])
    monkeypatch.setattr(room, "broadcast", broadcast)
    monkeypatch.setattr(game.asyncio, "sleep", AsyncMock())
    for _ in range(2):
        asyncio.run(game.start_game_loop(room))
        assert room.state == "lobby"
    assert len(set(rounds)) == 4
    assert all(1900 <= score <= 2000 for score in final_scores)


def test_http_upload_requires_real_authentication(api):
    client, _, user, _ = api
    app.dependency_overrides.pop(get_current_user)
    assert client.post("/upload/", files={"file": ("book.pdf", pdf_bytes(), "application/pdf")}).status_code == 401
    token = create_access_token({"sub": user.email})
    response = client.post("/upload/", headers={"Authorization": f"Bearer {token}"},
                           files={"file": ("book.pdf", pdf_bytes(), "application/pdf")})
    assert response.status_code == 200
