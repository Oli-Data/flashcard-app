# Lumitudy
**AI-powered flashcard generator that transforms any textbook into a personalized study session.**

🔗 **Live App:** [Lumitudy.vercel.app](https://Lumitudy.vercel.app)

---

## Overview

Lumitudy allows students to upload PDF, DOCX, or EPUB textbooks and instantly generate AI-powered flashcards from any chapter. Each flashcard includes a source quote from the original text, so users can verify the AI isn't hallucinating. Beyond flashcards, the app includes a multiple choice exam mode with per-chapter leaderboards, a live Kahoot-style multiplayer quiz mode, and a friends system for connecting with other users.

---

## Features

- **Multi-format document parsing** — Upload PDF, DOCX, or EPUB files; chapters are automatically detected
- **AI flashcard generation** — Claude generates contextually accurate flashcards with source verification
- **Source quote validation** — Returned quotes must occur in the chapter (ignoring whitespace differences). This checks the quotation, not the factual correctness of the answer.
- **Exam mode** — Answers are graded on the server, with immediate feedback and a per-chapter leaderboard of verified attempts
- **Kahoot-style multiplayer mode** — Host a live game from any chapter or saved set; players join with a game code over WebSockets, answer against the clock, and climb a real-time leaderboard
- **Friends** — Add friends with a personal friend code, send and accept requests, and manage your friends list
- **User authentication** — JWT-based auth with email/password login and bcrypt-hashed passwords
- **File library** — Uploaded textbooks are saved so users don't need to re-upload
- **Saved sets** — Flashcard sets are saved to the database, reloadable anytime, and reusable as the question source for a Kahoot game
- **Animated card transitions** — Cards swipe left/right with smooth CSS animations

---

## Tech Stack

### Backend
- **FastAPI** — REST API framework, including a WebSocket endpoint for the multiplayer game
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
- **Native WebSocket API** — Real-time connection for the multiplayer game
- **CSS-in-JS** — Custom glass morphism design system
- **Deployed on Vercel**

---

## Architecture

```
flashcard-app/
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── database.py           # SQLAlchemy models and session management
│   ├── game_manager.py       # In-memory game room state for Kahoot mode
│   ├── routers/
│   │   ├── auth.py           # Register and login endpoints
│   │   ├── upload.py         # File upload and file library endpoints
│   │   ├── flashcards.py     # Flashcard and exam generation endpoints
│   │   ├── sets.py           # Save, retrieve, and delete flashcard sets
│   │   ├── scores.py         # Submit exam scores and fetch per-chapter leaderboards
│   │   ├── friends.py        # Friend requests and friends list
│   │   └── game.py           # Kahoot-style game creation and WebSocket game loop
│   └── services/
│       ├── ai.py              # Anthropic Claude API integration
│       ├── auth.py            # JWT, bcrypt, and file-ownership utilities
│       └── parser.py          # PDF, DOCX, EPUB parsing logic
└── frontend/
    └── src/
        ├── App.jsx               # Main app shell, view switching, card navigation
        ├── main.jsx              # React entry point
        ├── components/
        │   ├── Auth.jsx          # Login and signup UI
        │   ├── Upload.jsx        # File upload component
        │   ├── FileLibrary.jsx   # Saved textbooks panel
        │   ├── ChapterSelect.jsx # Chapter picker and flashcard controls
        │   ├── Flashcard.jsx     # Animated flashcard with source quote
        │   ├── ExamMode.jsx      # Multiple choice exam and leaderboard
        │   ├── Friends.jsx       # Friend requests and friends list UI
        │   └── Kahoot.jsx        # Multiplayer game host/join/play UI
        └── context/
            └── AuthContext.jsx   # Global auth state management
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
| POST | `/flashcards/exam` | Create a server-held exam; returns an `exam_id` and questions without answer keys |
| POST | `/flashcards/exam/{exam_id}/answer` | Submit `question_index` and `answer_index`; receive feedback for that question |
| POST | `/sets/save` | Save a flashcard set |
| GET | `/sets/` | Get all saved sets |
| DELETE | `/sets/{id}` | Delete a saved set |
| POST | `/scores/` | Submit `{ "exam_id": "..." }` to save a completed attempt's server-calculated score |
| GET | `/scores/{chapter}` | Get the top-10 leaderboard for a chapter |
| POST | `/friends/request` | Send a friend request by friend code |
| GET | `/friends/` | Get accepted friends |
| GET | `/friends/requests` | Get pending incoming friend requests |
| POST | `/friends/accept/{friendship_id}` | Accept a friend request |
| DELETE | `/friends/{friendship_id}` | Remove a friend or decline a request |
| POST | `/game/create` | Create a Kahoot-style game room from a chapter |
| POST | `/game/{game_code}/update-questions` | Host: swap in new questions or a saved set |
| WS | `/game/ws/{game_code}/{username}` | Real-time game connection for host and players |

---

## Built By
**Christian Olivares-Rodriguez** — ML Engineer & Founder of CO³ Labs  
[GitHub](https://github.com/Oli-Data) · [LinkedIn](https://www.linkedin.com/in/christian-olivares-rodriguez/)

## Validation and operating limits

- Uploads are limited to 25 MB. PDFs are limited to 2,000 pages; DOCX/EPUB archives may expand to at most 100 MB. Uploads use generated storage names and are checked for readable text before replacing an existing file.
- Every generation route checks document ownership, including multiplayer creation and question updates. Existing file records outside their owner's upload directory are rejected.
- Generation sends the complete selected chapter, up to 120,000 characters, and accepts 1–50 items. Larger chapters return a visible error asking for a shorter section; they are never silently truncated. Full-chapter requests can use more input tokens than the previous 8,000-character limit.
- Flashcards select a numbered passage from the complete chapter. The server copies that passage directly into `source_quote`, preserving the document's extracted wording and avoiding failures caused by the model rewriting quotes. Invalid passage references are rejected. Quotes may include surrounding context; passage selection and educational correctness still need review.
- AI responses are checked for item count, required fields, distinct questions, four distinct exam options, and valid answer indices. Failed checks return a retryable error.
- Exams expire after 24 hours. Answers are accepted once, in order; identical retries are safe. The answer key stays on the server until an answer is submitted. Scores are calculated from the stored answers, and saving a result is idempotent.
- Historical browser-submitted scores are retained in the database but excluded from the verified leaderboard. The new `exam_attempts` table is added automatically on startup; existing tables do not require alteration.
- Deploy the frontend and backend changes together. An exam already open in the old frontend must be restarted after refreshing. The score endpoint no longer accepts browser-supplied totals.
- Multiplayer accepts answers only during the current question and calculates speed bonuses using the server's clock. Saved sets need at least four distinct answers; other cards' answers are used as shuffled distractors and may need educational review.
- Multiplayer rooms still live in one server process. Run one application worker; rooms do not survive a restart. Use durable storage for the SQLite database and uploads. `DATABASE_URL` and `UPLOAD_DIR` optionally override their existing local defaults; `ANTHROPIC_MODEL` optionally overrides the default model.

## Regression checks

From the repository root:

```bash
python -m pip install -r backend/requirements-dev.txt
python -m pytest backend/tests -q
cd frontend
npm ci
npm test
npm run build
```

Backend tests use a temporary database and upload directory. AI responses are mocked, so checks do not use API credits or real user documents. Frontend tests cover server-graded exams and retries. GitHub Actions runs the backend tests, frontend tests, and production build on pushes and pull requests.
