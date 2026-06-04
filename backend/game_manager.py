import asyncio
import json
import random
import string
from typing import Dict, List
from fastapi import WebSocket

def generate_game_code():
    """Generate a unique 6 character game code like GAME-AB12"""
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"GAME-{chars}"

class Player:
    """Represents a connected player in a game"""
    def __init__(self, websocket: WebSocket, username: str):
        self.websocket = websocket
        self.username = username
        self.score = 0
        self.answered = False
        self.last_answer_correct = False
        self.last_answer_time = None

class GameRoom:
    """
    Manages a single game room with all its players and state.
    Handles the full game lifecycle from lobby to results.
    """
    def __init__(self, game_code: str, host_username: str, questions: list):
        self.game_code = game_code
        self.host_username = host_username
        self.questions = questions
        self.players: Dict[str, Player] = {}
        self.state = "lobby"  # lobby, question, results, finished
        self.current_question_index = 0
        self.question_start_time = None
        self.time_limit = 20  # seconds per question

    def add_player(self, username: str, websocket: WebSocket):
        """Add a player to the room"""
        self.players[username] = Player(websocket, username)

    def remove_player(self, username: str):
        """Remove a player from the room"""
        if username in self.players:
            del self.players[username]

    def get_leaderboard(self):
        """Get current scores sorted by highest first"""
        return sorted(
            [{"username": p.username, "score": p.score} for p in self.players.values()],
            key=lambda x: x["score"],
            reverse=True
        )

    def all_answered(self):
        """Check if all players have submitted an answer"""
        return all(p.answered for p in self.players.values())

    def reset_answers(self):
        """Reset answer state for all players before next question"""
        for p in self.players.values():
            p.answered = False
            p.last_answer_correct = False
            p.last_answer_time = None

    async def broadcast(self, message: dict):
        """Send a message to all connected players"""
        disconnected = []
        for username, player in self.players.items():
            try:
                await player.websocket.send_json(message)
            except Exception:
                disconnected.append(username)
        for username in disconnected:
            self.remove_player(username)

    async def send_to(self, username: str, message: dict):
        """Send a message to a specific player"""
        if username in self.players:
            try:
                await self.players[username].websocket.send_json(message)
            except Exception:
                self.remove_player(username)

class GameManager:
    """
    Global manager that tracks all active game rooms.
    Handles room creation, joining, and cleanup.
    """
    def __init__(self):
        self.rooms: Dict[str, GameRoom] = {}

    def create_room(self, host_username: str, questions: list) -> str:
        """Create a new game room and return its code"""
        game_code = generate_game_code()
        while game_code in self.rooms:
            game_code = generate_game_code()
        self.rooms[game_code] = GameRoom(game_code, host_username, questions)
        return game_code

    def get_room(self, game_code: str) -> GameRoom:
        """Get a room by its game code"""
        return self.rooms.get(game_code)

    def delete_room(self, game_code: str):
        """Remove a room when the game ends"""
        if game_code in self.rooms:
            del self.rooms[game_code]

# Global singleton instance
game_manager = GameManager()