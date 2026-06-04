from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, flashcards, auth, sets, scores, friends
from dotenv import load_dotenv
from database import create_tables
from routers import upload, flashcards, auth, sets, scores, friends, game

# Load environment variables from .env file
load_dotenv()

# Create database tables on startup
create_tables()

app = FastAPI(title="Lumitudy API")

# Allow requests from frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://flashcard-mrnsrjxq6-christian-olivares-rodriguezs-projects.vercel.app",
        "https://flashcard-app.vercel.app",
        "https://lumitodee.vercel.app",
        "https://lumitudy.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(upload.router)
app.include_router(flashcards.router)
app.include_router(auth.router)
app.include_router(sets.router)
app.include_router(scores.router)
app.include_router(friends.router)
app.include_router(game.router)

@app.get("/")
def root():
    return {"message": "Lumitudy API is running"}