import asyncio
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from services.auth import get_current_user
from services.parser import parse_file
from services.ai import generate_exam
from game_manager import game_manager
from database import User

router = APIRouter(prefix="/game", tags=["game"])

class CreateGameRequest(BaseModel):
    """Request model for creating a new game"""
    file_path: str
    chapter: str
    num_questions: int = 10

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
    try:
        chapters = parse_file(request.file_path)
        if request.chapter not in chapters:
            raise HTTPException(status_code=404, detail="Chapter not found")
        chapter_text = chapters[request.chapter]
        questions = generate_exam(chapter_text, request.num_questions)
        game_code = game_manager.create_room(current_user.username, questions)
        return {"game_code": game_code, "num_questions": len(questions)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws/{game_code}/{username}")
async def game_websocket(websocket: WebSocket, game_code: str, username: str):
    """
    WebSocket endpoint for real-time game communication.
    Handles the full game lifecycle for each connected player.
    """
    await websocket.accept()

    room = game_manager.get_room(game_code)
    if not room:
        await websocket.send_json({"type": "error", "message": "Game not found"})
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
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "start_game" and username == room.host_username:
                await start_game_loop(room)

            elif msg_type == "submit_answer":
                await handle_answer(room, username, data.get("answer_index"), data.get("time_taken"))

    except WebSocketDisconnect:
        room.remove_player(username)
        await room.broadcast({
            "type": "player_left",
            "username": username,
            "players": list(room.players.keys())
        })
        if username == room.host_username or len(room.players) == 0:
            game_manager.delete_room(game_code)

async def start_game_loop(room):
    """Run the full game loop"""
    room.state = "playing"

    for i, question in enumerate(room.questions):
        room.current_question_index = i
        room.reset_answers()
        room.question_start_time = time.time()

        await room.broadcast({
            "type": "question",
            "index": i,
            "total": len(room.questions),
            "question": question["question"],
            "options": question["options"],
            "time_limit": room.time_limit
        })

        start = time.time()
        while not room.all_answered() and (time.time() - start) < room.time_limit:
            await asyncio.sleep(0.5)

        await room.broadcast({
            "type": "question_result",
            "correct_index": question["correct_index"],
            "leaderboard": room.get_leaderboard()
        })

        await asyncio.sleep(3)

    room.state = "finished"
    await room.broadcast({
        "type": "game_over",
        "leaderboard": room.get_leaderboard()
    })
    game_manager.delete_room(room.game_code)

async def handle_answer(room, username: str, answer_index: int, time_taken: float):
    """Process a player's answer and calculate points"""
    if username not in room.players:
        return

    player = room.players[username]
    if player.answered:
        return

    player.answered = True
    question = room.questions[room.current_question_index]
    correct = answer_index == question["correct_index"]
    player.last_answer_correct = correct

    if correct:
        time_taken = max(0, min(time_taken or room.time_limit, room.time_limit))
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