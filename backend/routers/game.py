import asyncio
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool
from routers.flashcards import chapter_material
from uuid import uuid4
import random
from database import get_db
from services.auth import get_current_user, get_user_from_token
from services.ai import generate_exam
from game_manager import game_manager
from database import User

router = APIRouter(prefix="/game", tags=["game"])

class CreateGameRequest(BaseModel):
    """Request model for creating a new game"""
    file_path: str
    chapter: str
    num_questions: int = Field(default=10, ge=1, le=50, strict=True)

@router.post("/create")
async def create_game(
    request: CreateGameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new multiplayer game room.
    Generates questions and returns a game code for players to join.
    """
    questions = await run_in_threadpool(
        chapter_material, request, current_user, db, generate_exam, request.num_questions
    )
    game_code = game_manager.create_room(current_user.username, questions)
    return {"game_code": game_code, "num_questions": len(questions)}


class SavedCard(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    answer: str = Field(min_length=1, max_length=4000)


class UpdateQuestionsRequest(BaseModel):
    """Request model for updating game questions from lobby"""
    file_path: str | None = None
    chapter: str | None = None
    num_questions: int = Field(default=10, ge=1, le=50, strict=True)
    cards: list[SavedCard] | None = Field(default=None, max_length=50)

@router.post("/{game_code}/update-questions")
async def update_questions(
    game_code: str,
    request: UpdateQuestionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the questions for an existing game room.
    Host can generate new questions from a file or use a saved set.
    """
    room = game_manager.get_room(game_code)
    if not room:
        raise HTTPException(status_code=404, detail="Game not found")

    if room.host_username != current_user.username:
        raise HTTPException(status_code=403, detail="Only the host can update questions")

    if room.state != "lobby":
        raise HTTPException(status_code=409, detail="Questions can only be changed in the lobby.")
    if request.cards:
        # Use other saved answers as distractors instead of placeholder options.
        answers = list(dict.fromkeys(card.answer.strip() for card in request.cards))
        if len({answer.casefold() for answer in answers if answer}) < 4:
            raise HTTPException(status_code=422, detail="Choose a set with at least four distinct answers.")
        questions = []
        for card in request.cards[:request.num_questions]:
            correct = card.answer.strip()
            if not correct or not card.question.strip():
                raise HTTPException(status_code=422, detail="Saved questions and answers cannot be blank.")
            distractors = list({a.casefold(): a for a in answers if a.casefold() != correct.casefold()}.values())
            options = [correct, *random.sample(distractors, 3)]
            random.shuffle(options)
            questions.append({"question": card.question.strip(), "options": options,
                              "correct_index": options.index(correct)})
    elif request.file_path and request.chapter:
        questions = await run_in_threadpool(
            chapter_material, request, current_user, db, generate_exam, request.num_questions
        )
    else:
        raise HTTPException(status_code=400, detail="Must provide either cards or file_path and chapter")
    # The host may have started the game while generation ran.
    if room.state != "lobby":
        raise HTTPException(status_code=409, detail="The game has already started.")
    room.questions = questions

    # Notify all players that questions were updated
    await room.broadcast({
        "type": "questions_updated",
        "num_questions": len(room.questions),
        "source": "saved_set" if request.cards else "generated"
    })

    return {"message": "Questions updated", "num_questions": len(room.questions)}

@router.websocket("/ws/{game_code}/{username}")
async def game_websocket(websocket: WebSocket, game_code: str, username: str, db: Session = Depends(get_db)):
    await websocket.accept()

    # Verify the connecting client actually owns this username via their JWT
    # (sent as a query param since browsers can't set custom WS headers).
    # Without this, anyone could pass any username in the URL and impersonate
    # another player or the host.
    authed_user = get_user_from_token(websocket.query_params.get("token"), db)
    if not authed_user or authed_user.username != username:
        await websocket.send_json({"type": "error", "message": "Authentication failed"})
        await websocket.close()
        return

    room = game_manager.get_room(game_code)
    if not room:
        await websocket.send_json({"type": "error", "message": "Game not found"})
        await websocket.close()
        return

    if username in room.players or room.state != "lobby":
        await websocket.send_json({"type": "error", "message": "Already connected or game in progress"})
        await websocket.close()
        return
    room.add_player(username, websocket)

    await room.broadcast({
        "type": "player_joined",
        "username": username,
        "players": list(room.players.keys()),
        "host": room.host_username
    })

    try:
        while True:
            try:
                # Wait for message with timeout to send keepalive pings
                data = await asyncio.wait_for(websocket.receive_json(), timeout=15)
                if not isinstance(data, dict):
                    continue
                msg_type = data.get("type")

                if msg_type == "start_game" and username == room.host_username:
                    if room.state == "lobby" and room.questions:
                        room.state = "starting"
                        room.game_task = asyncio.create_task(start_game_loop(room))

                elif msg_type == "submit_answer":
                    await handle_answer(room, username, data.get("answer_index"), data.get("question_id"))

                elif msg_type == "ping":
                    await websocket.send_json({"type": "pong"})

            except asyncio.TimeoutError:
                # Send keepalive ping to prevent connection timeout
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    break

    except (WebSocketDisconnect, ValueError):
        pass
    finally:
        room.remove_player(username)
        await room.broadcast({
            "type": "player_left",
            "username": username,
            "players": list(room.players.keys())
        })
        if username == room.host_username or len(room.players) == 0:
            if room.game_task and not room.game_task.done():
                room.game_task.cancel()
            game_manager.delete_room(game_code)
            await room.broadcast({"type": "error", "message": "The host left the game."})

async def start_game_loop(room):
    """Run the full game loop"""
    for player in room.players.values():
        player.score = 0

    for i, question in enumerate(room.questions):
        room.current_question_index = i
        room.reset_answers()
        room.question_start_time = time.monotonic()
        room.question_id = uuid4().hex
        room.state = "question"

        await room.broadcast({
            "type": "question",
            "question_id": room.question_id,
            "index": i,
            "total": len(room.questions),
            "question": question["question"],
            "options": question["options"],
            "time_limit": room.time_limit
        })

        while not room.all_answered() and (time.monotonic() - room.question_start_time) < room.time_limit:
            await asyncio.sleep(0.5)

        room.state = "results"
        await room.broadcast({
            "type": "question_result",
            "correct_index": question["correct_index"],
            "leaderboard": room.get_leaderboard(),
            "is_last": i == len(room.questions) - 1
        })

        await asyncio.sleep(3)

    room.state = "finished"
    await room.broadcast({
        "type": "game_over",
        "leaderboard": room.get_leaderboard()
    })
    for player in room.players.values():
        player.score = 0
        player.answered = False
    room.state = "lobby"

async def handle_answer(room, username: str, answer_index: int, question_id: str):
    """Process a player's answer and calculate points"""
    if (username not in room.players or room.state != "question"
            or question_id != room.question_id or type(answer_index) is not int
            or not 0 <= answer_index <= 3):
        return
    time_taken = time.monotonic() - room.question_start_time
    if time_taken < 0 or time_taken >= room.time_limit:
        return

    player = room.players[username]
    if player.answered:
        return

    player.answered = True
    question = room.questions[room.current_question_index]
    correct = answer_index == question["correct_index"]
    player.last_answer_correct = correct

    if correct:
        time_bonus = room.time_limit - time_taken
        points = int(500 + (time_bonus / room.time_limit) * 500)
        player.score += points
    else:
        points = 0

    await room.send_to(username, {
        "type": "answer_result",
        "correct": correct,
        "points_earned": points,
        "total_score": player.score
    })
