import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useAuth } from "./context/AuthContext"
import Upload from "./components/Upload"
import ChapterSelect from "./components/ChapterSelect"
import Auth from "./components/Auth"
import ExamMode from "./components/ExamMode"
import FileLibrary from "./components/FileLibrary"
import Friends from "./components/Friends"
import Kahoot from "./components/Kahoot"

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0a1628;
    background-image: 
      radial-gradient(ellipse at 20% 20%, rgba(0, 180, 200, 0.18) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 10%, rgba(80, 40, 180, 0.2) 0%, transparent 45%),
      radial-gradient(ellipse at 60% 80%, rgba(0, 150, 180, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 10% 70%, rgba(20, 80, 160, 0.15) 0%, transparent 40%);
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    color: #e8f4f8;
  }

  .app-container {
    max-width: 780px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 0.75rem 1.25rem;
    background: rgba(0, 200, 220, 0.06);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 220, 240, 0.15);
    border-radius: 14px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06);
    position: relative;
  }

  .logo {
    font-family: 'Syne', sans-serif;
    font-size: 1.4rem;
    font-weight: 800;
    background: linear-gradient(135deg, #00e5ff, #40a9ff, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: nowrap;
  }

  .profile-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.9rem;
    background: rgba(0, 180, 220, 0.1);
    border: 1px solid rgba(0, 220, 240, 0.2);
    border-radius: 20px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    color: rgba(200, 240, 255, 0.8);
    transition: all 0.2s;
    white-space: nowrap;
  }

  .profile-btn:hover {
    background: rgba(0, 180, 220, 0.2);
    color: #00e5ff;
  }

  .profile-avatar {
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #00e5ff, #a78bfa);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: #0a1628;
    flex-shrink: 0;
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: rgba(10, 22, 40, 0.95);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(0, 220, 240, 0.15);
    border-radius: 14px;
    padding: 0.5rem;
    min-width: 200px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.4);
    z-index: 100;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    width: 100%;
    padding: 0.65rem 0.85rem;
    background: none;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    color: rgba(200, 240, 255, 0.7);
    transition: all 0.15s;
    text-align: left;
  }

  .dropdown-item:hover {
    background: rgba(0, 180, 220, 0.1);
    color: #00e5ff;
  }

  .dropdown-item.danger {
    color: rgba(248, 113, 113, 0.7);
  }

  .dropdown-item.danger:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
  }

  .dropdown-divider {
    height: 1px;
    background: rgba(0, 220, 240, 0.08);
    margin: 0.35rem 0;
  }

  .hero {
    text-align: center;
    padding: 2.5rem 1rem 2rem;
    margin-bottom: 1.5rem;
  }

  .hero-eyebrow {
    display: inline-block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: rgba(0, 220, 240, 0.7);
    background: rgba(0, 200, 220, 0.08);
    border: 1px solid rgba(0, 220, 240, 0.2);
    padding: 0.3rem 0.9rem;
    border-radius: 20px;
    margin-bottom: 1.2rem;
  }

  .hero-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.6rem, 5vw, 2.2rem);
    font-weight: 800;
    line-height: 1.15;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #e8f4f8 0%, #00e5ff 50%, #a78bfa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-sub {
    font-size: clamp(0.85rem, 2.5vw, 1rem);
    color: rgba(200, 235, 245, 0.55);
    max-width: 420px;
    margin: 0 auto;
    line-height: 1.7;
    font-weight: 300;
  }

  .glass-panel {
    background: rgba(0, 180, 210, 0.06);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(0, 220, 240, 0.12);
    border-radius: 18px;
    padding: 1.5rem;
    margin-bottom: 1.25rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06);
    position: relative;
    overflow: hidden;
  }

  .glass-panel::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,220,240,0.3), transparent);
  }

  .panel-title {
    font-family: 'Syne', sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    color: rgba(0, 220, 240, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 1rem;
  }

  .btn {
    padding: 0.5rem 1.1rem;
    border-radius: 9px;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .btn-primary {
    background: rgba(0, 180, 220, 0.2);
    color: #00e5ff;
    border: 1px solid rgba(0, 220, 240, 0.3);
  }

  .btn-primary:hover {
    background: rgba(0, 180, 220, 0.35);
    transform: translateY(-1px);
  }

  .btn-ghost {
    background: rgba(255,255,255,0.05);
    color: rgba(200,240,255,0.65);
    border: 1px solid rgba(255,255,255,0.08);
  }

  .btn-ghost:hover {
    background: rgba(255,255,255,0.1);
    color: rgba(200,240,255,0.9);
  }

  .btn-danger {
    background: rgba(239,68,68,0.1);
    color: #f87171;
    border: 1px solid rgba(239,68,68,0.2);
  }

  .btn-danger:hover { background: rgba(239,68,68,0.2); }

  .saved-set-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(0,200,220,0.07);
  }

  .saved-set-row:last-child { border-bottom: none; }
  .set-name { font-weight: 500; color: #e0f0f8; }
  .set-meta { font-size: 0.78rem; color: rgba(200,235,245,0.3); margin-left: 0.5rem; }
  .row-actions { display: flex; gap: 0.5rem; }

  .flashcard-wrapper { margin-bottom: 1.5rem; }

  .flashcard-slide {
    animation-duration: 0.35s;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    animation-fill-mode: both;
  }

  @keyframes slideOutLeft {
    from { transform: translateX(0) rotate(0deg); opacity: 1; }
    to { transform: translateX(-120%) rotate(-8deg); opacity: 0; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0) rotate(0deg); opacity: 1; }
    to { transform: translateX(120%) rotate(8deg); opacity: 0; }
  }
  @keyframes slideInLeft {
    from { transform: translateX(120%) rotate(8deg); opacity: 0; }
    to { transform: translateX(0) rotate(0deg); opacity: 1; }
  }
  @keyframes slideInRight {
    from { transform: translateX(-120%) rotate(-8deg); opacity: 0; }
    to { transform: translateX(0) rotate(0deg); opacity: 1; }
  }

  .slide-out-left { animation-name: slideOutLeft; }
  .slide-out-right { animation-name: slideOutRight; }
  .slide-in-left { animation-name: slideInLeft; }
  .slide-in-right { animation-name: slideInRight; }

  .flashcard-inner {
    background: rgba(0, 180, 210, 0.07);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(0, 220, 240, 0.18);
    border-radius: 20px;
    padding: 3rem 2rem;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.3s, box-shadow 0.3s, background 0.3s;
    box-shadow: 0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07);
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .flashcard-inner::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,220,240,0.4), transparent);
  }

  .flashcard-inner:hover {
    border-color: rgba(0, 220, 240, 0.35);
    box-shadow: 0 12px 50px rgba(0,180,210,0.15), inset 0 1px 0 rgba(255,255,255,0.07);
  }

  .flashcard-inner.flipped {
    background: rgba(100, 60, 220, 0.12);
    border-color: rgba(160, 120, 255, 0.3);
  }

  .flashcard-inner.flipped::before {
    background: linear-gradient(90deg, transparent, rgba(160,120,255,0.4), transparent);
  }

  .card-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(0, 220, 240, 0.5);
    margin-bottom: 1rem;
  }

  .flashcard-inner.flipped .card-label { color: rgba(160, 120, 255, 0.6); }

  .card-text {
    font-size: clamp(0.95rem, 2.5vw, 1.15rem);
    font-weight: 400;
    color: #e8f4f8;
    line-height: 1.65;
  }

  .card-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
    margin-top: 1.25rem;
  }

  .card-counter {
    font-family: 'Syne', sans-serif;
    font-size: 0.88rem;
    color: rgba(200, 235, 245, 0.35);
    min-width: 60px;
    text-align: center;
  }

  .source-btn {
    display: block;
    margin: 0.85rem auto 0;
    background: rgba(0, 180, 210, 0.06);
    border: 1px solid rgba(0, 220, 240, 0.18);
    color: rgba(0, 220, 240, 0.65);
    padding: 0.35rem 1.1rem;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.78rem;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .source-btn:hover {
    background: rgba(0, 180, 210, 0.14);
    border-color: rgba(0, 220, 240, 0.35);
    color: rgba(0, 220, 240, 0.9);
  }

  .source-quote {
    margin-top: 0.75rem;
    padding: 0.9rem 1.2rem;
    background: rgba(0, 180, 210, 0.06);
    border-left: 2px solid rgba(0, 220, 240, 0.4);
    border-radius: 4px;
    font-size: 0.85rem;
    color: rgba(200, 235, 245, 0.55);
    font-style: italic;
    line-height: 1.65;
    text-align: left;
  }

  .empty-state {
    color: rgba(200, 235, 245, 0.25);
    font-size: 0.88rem;
    padding: 0.5rem 0;
  }

  select, input[type="text"], input[type="email"], input[type="password"] {
    background: rgba(0, 180, 210, 0.06);
    border: 1px solid rgba(0, 220, 240, 0.15);
    color: #e8f4f8;
    border-radius: 9px;
    padding: 0.65rem 0.9rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.92rem;
    width: 100%;
    outline: none;
    transition: border-color 0.2s;
  }

  select:focus, input:focus {
    border-color: rgba(0, 220, 240, 0.4);
    box-shadow: 0 0 0 3px rgba(0, 200, 240, 0.08);
  }

  select option { background: #0f1e35; }

  input[type="range"] {
    background: transparent;
    border: none;
    padding: 0;
    accent-color: #00e5ff;
  }

  label {
    color: rgba(200, 235, 245, 0.55);
    font-size: 0.88rem;
    display: block;
    margin-bottom: 0.4rem;
  }

  @media (max-width: 480px) {
    .app-container { padding: 1rem 0.75rem; }
    .hero { padding: 1.5rem 0.5rem 1.25rem; }
    .glass-panel { padding: 1.1rem; }
    .flashcard-inner { padding: 2rem 1.25rem; min-height: 160px; }
    .card-nav { gap: 0.75rem; }
  }
`

function SourceQuote({ quote }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ textAlign: "center" }}>
      <button className="source-btn" onClick={() => setShow(!show)}>
        {show ? "Hide Source" : "View Source"}
      </button>
      {show && <div className="source-quote">"{quote}"</div>}
    </div>
  )
}

export default function App() {
  const { user, username, friendCode, logout } = useAuth()
  const [fileData, setFileData] = useState(null)
  const [flashcards, setFlashcards] = useState([])
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [savedSets, setSavedSets] = useState([])
  const [showSaved, setShowSaved] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [examMode, setExamMode] = useState(false)
  const [slideAnim, setSlideAnim] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [kahootMode, setKahootMode] = useState(false)

  useEffect(() => {
    if (user) fetchSavedSets()
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSavedSets = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/sets/`)
      setSavedSets(res.data)
    } catch (err) {
      console.error("Failed to fetch saved sets")
    }
  }

  const navigateCard = (direction) => {
    if (isAnimating) return
    const newIndex = direction === "next"
      ? Math.min(flashcards.length - 1, currentCard + 1)
      : Math.max(0, currentCard - 1)
    if (newIndex === currentCard) return

    setIsAnimating(true)
    setSlideAnim(direction === "next" ? "slide-out-left" : "slide-out-right")

    setTimeout(() => {
      setCurrentCard(newIndex)
      setFlipped(false)
      setSlideAnim(direction === "next" ? "slide-in-left" : "slide-in-right")
      setTimeout(() => {
        setSlideAnim("")
        setIsAnimating(false)
      }, 350)
    }, 350)
  }

  const loadSet = (set) => {
    setFlashcards(set.cards)
    setCurrentCard(0)
    setFlipped(false)
    setShowSaved(false)
    setDropdownOpen(false)
  }

  const deleteSet = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/sets/${id}`)
      fetchSavedSets()
    } catch (err) {
      console.error("Failed to delete set")
    }
  }

  if (!user) return <Auth />

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">

        <header className="header">
          <div className="logo">Lumitudy</div>

          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              className="profile-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="profile-avatar">
                {username ? username[0].toUpperCase() : "?"}
              </div>
              <span>{username}</span>
              <span style={{ opacity: 0.4, fontSize: "0.7rem" }}>▾</span>
            </button>

            {dropdownOpen && (
              <div className="dropdown">
                <button
                  className="dropdown-item"
                  onClick={() => { setShowSaved(!showSaved); fetchSavedSets(); setDropdownOpen(false) }}
                >
                  📚 My Sets
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => { setShowFriends(!showFriends); setDropdownOpen(false) }}
                >
                  👥 Friends
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-item danger" onClick={logout}>
                  ⎋ Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="hero">
          <span className="hero-eyebrow">AI-Powered Study Tool</span>
          <h1 className="hero-title">Turn any textbook into a study session</h1>
          <p className="hero-sub">Upload a PDF, DOCX, or EPUB and instantly generate flashcards, source-verified by AI.</p>
        </div>

        {showSaved && (
          <div className="glass-panel">
            <p className="panel-title">Saved Sets</p>
            {savedSets.length === 0 ? (
              <p className="empty-state">No saved sets yet.</p>
            ) : (
              savedSets.map((set) => (
                <div className="saved-set-row" key={set.id}>
                  <div>
                    <span className="set-name">{set.title}</span>
                    <span className="set-meta">{set.cards.length} cards</span>
                  </div>
                  <div className="row-actions">
                    <button className="btn btn-primary" onClick={() => loadSet(set)}>Load</button>
                    <button className="btn btn-danger" onClick={() => deleteSet(set.id)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {showFriends && <Friends onClose={() => setShowFriends(false)} />}

        <Upload onUpload={setFileData} />
        <FileLibrary onFileSelect={setFileData} />

        {fileData && examMode && (
          <ExamMode fileData={fileData} onExit={() => setExamMode(false)} />
        )}

        {fileData && !examMode && !kahootMode && (
          <ChapterSelect
            fileData={fileData}
            onExamMode={() => setExamMode(true)}
            onKahoot={() => setKahootMode(true)}
            onGenerate={(cards) => {
              setFlashcards(cards)
              setCurrentCard(0)
              setFlipped(false)
              fetchSavedSets()
            }}
          />
        )}

        {kahootMode && (
          <Kahoot fileData={fileData} onExit={() => setKahootMode(false)} />
        )}

        {flashcards.length > 0 && !examMode && (
          <div className="flashcard-wrapper">
            <div className={`flashcard-slide ${slideAnim}`}>
              <div
                className={`flashcard-inner ${flipped ? "flipped" : ""}`}
                onClick={() => !isAnimating && setFlipped(!flipped)}
              >
                <div>
                  <p className="card-label">{flipped ? "Answer" : "Question — tap to flip"}</p>
                  <p className="card-text">{flipped ? flashcards[currentCard].answer : flashcards[currentCard].question}</p>
                </div>
              </div>
            </div>

            {flashcards[currentCard].source_quote && (
              <SourceQuote quote={flashcards[currentCard].source_quote} />
            )}

            <div className="card-nav">
              <button
                className="btn btn-ghost"
                onClick={() => navigateCard("prev")}
                disabled={currentCard === 0 || isAnimating}
              >
                ← Prev
              </button>
              <span className="card-counter">{currentCard + 1} / {flashcards.length}</span>
              <button
                className="btn btn-ghost"
                onClick={() => navigateCard("next")}
                disabled={currentCard === flashcards.length - 1 || isAnimating}
              >
                Next →
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  )
}