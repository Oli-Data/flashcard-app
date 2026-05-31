# Lumitodee

**AI-powered flashcard generator that transforms any textbook into a personalized study session.**

🔗 **Live App:** [lumitodee.vercel.app](https://lumitodee.vercel.app)

---

## Overview

Lumitodee allows students to upload PDF, DOCX, or EPUB textbooks and instantly generate AI-powered flashcards from any chapter. Each flashcard includes a source quote from the original text, so users can verify the AI isn't hallucinating. The app also features a multiple choice exam mode for active recall practice.

---

## Features

- **Multi-format document parsing** — Upload PDF, DOCX, or EPUB files; chapters are automatically detected
- **AI flashcard generation** — Claude generates contextually accurate flashcards with source verification
- **Source quote verification** — Every flashcard cites the exact passage from the original text
- **Exam mode** — Multiple choice questions with instant feedback and end-of-exam review
- **User authentication** — JWT-based auth with persistent sessions
- **File library** — Uploaded textbooks are saved so users don't need to re-upload
- **Saved sets** — Flashcard sets are saved to the database and can be reloaded anytime
- **Animated card transitions** — Cards swipe left/right with smooth CSS animations

---

## Tech Stack

### Backend
- **FastAPI** — REST API framework
- **SQLAlchemy + SQLite** — Database ORM and local storage
- **PyMuPDF** — PDF parsing
- **python-docx** — DOCX parsing
- **EbookLib + BeautifulSoup** — EPUB parsing
- **Anthropic Claude API** — AI flashcard and exam generation
- **bcrypt + python-jose** — Password hashing and JWT authentication
- **Deployed on Render**

### Frontend
- **React + Vite** — Frontend framework
- **Axios** — HTTP client
- **CSS-in-JS** — Custom glass morphism design system
- **Deployed on Vercel**

---

## Architecture

```
flashcard-app/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # SQLAlchemy models and session management
│   ├── routers/
│   │   ├── auth.py          # Register and login endpoints
│   │   ├── upload.py        # File upload and file library endpoints
│   │   ├── flashcards.py    # Flashcard and exam generation endpoints
│   │   └── sets.py          # Save, retrieve, and delete flashcard sets
│   └── services/
│       ├── ai.py            # Anthropic Claude API integration
│       ├── auth.py          # JWT and bcrypt utilities
│       └── parser.py        # PDF, DOCX, EPUB parsing logic
└── frontend/
    └── src/
        ├── App.jsx              # Main app component with routing logic
        ├── components/
        │   ├── Auth.jsx         # Login and signup UI
        │   ├── Upload.jsx       # File upload component
        │   ├── FileLibrary.jsx  # Saved textbooks panel
        │   ├── ChapterSelect.jsx # Chapter picker and flashcard controls
        │   ├── Flashcard.jsx    # Animated flashcard with source quote
        │   └── ExamMode.jsx     # Multiple choice exam interface
        └── context/
            └── AuthContext.jsx  # Global auth state management
```

---

## Local Development

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` folder:

```
ANTHROPIC_API_KEY=your_key_here
SECRET_KEY=your_secret_here
```

Start the server:

```bash
uvicorn main:app --reload
```

API docs available at `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` folder:

```
VITE_API_URL=http://127.0.0.1:8000
```

Start the dev server:

```bash
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create a new account |
| POST | `/auth/login` | Login and receive JWT token |
| POST | `/upload/` | Upload a textbook file |
| GET | `/upload/files` | List user's uploaded files |
| DELETE | `/upload/files/{id}` | Delete an uploaded file |
| POST | `/flashcards/generate` | Generate flashcards from a chapter |
| POST | `/flashcards/exam` | Generate exam questions from a chapter |
| POST | `/sets/save` | Save a flashcard set |
| GET | `/sets/` | Get all saved sets |
| DELETE | `/sets/{id}` | Delete a saved set |

---

## Built By

**Christian Olivares-Rodriguez** — ML Engineer & Founder of CO³ Labs  
[GitHub](https://github.com/Oli-Data) · [LinkedIn](https://www.linkedin.com/in/christian-olivares-rodriguez/)
