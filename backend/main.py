from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, flashcards
from routers import auth, sets
from dotenv import load_dotenv
from database import create_tables

load_dotenv()
create_tables()

app = FastAPI(title="Flashcard Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(flashcards.router)
app.include_router(auth.router)
app.include_router(sets.router)

@app.get("/")
def root():
    return {"message": "Flashcard API is running"}