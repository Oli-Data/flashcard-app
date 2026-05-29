import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "./context/AuthContext"
import Upload from "./components/Upload"
import ChapterSelect from "./components/ChapterSelect"
import Flashcard from "./components/Flashcard"
import Auth from "./components/Auth"
import ExamMode from "./components/ExamMode"

function App() {
  const { user, logout } = useAuth()
  const [fileData, setFileData] = useState(null)
  const [flashcards, setFlashcards] = useState([])
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [savedSets, setSavedSets] = useState([])
  const [showSaved, setShowSaved] = useState(false)
  const [examMode, setExamMode] = useState(false)

  useEffect(() => {
    if (user) fetchSavedSets()
  }, [user])

  const fetchSavedSets = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/sets/")
      setSavedSets(res.data)
    } catch (err) {
      console.error("Failed to fetch saved sets")
    }
  }

  const loadSet = (set) => {
    setFlashcards(set.cards)
    setCurrentCard(0)
    setFlipped(false)
    setShowSaved(false)
  }

  const deleteSet = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/sets/${id}`)
      fetchSavedSets()
    } catch (err) {
      console.error("Failed to delete set")
    }
  }

  if (!user) return <Auth />

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>Flashcard Generator</h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ color: "#666", fontSize: "0.9rem" }}>{user}</span>
          <button
            onClick={() => { setShowSaved(!showSaved); fetchSavedSets() }}
            style={{ padding: "0.4rem 1rem", cursor: "pointer", background: "#6c63ff", color: "white", border: "none", borderRadius: "6px" }}
          >
            {showSaved ? "Hide Saved" : "My Sets"}
          </button>
          <button
            onClick={logout}
            style={{ padding: "0.4rem 1rem", cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>

      {showSaved && (
        <div style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>My Saved Sets</h3>
          {savedSets.length === 0 ? (
            <p style={{ color: "#666" }}>No saved sets yet.</p>
          ) : (
            savedSets.map((set) => (
              <div key={set.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
                <div>
                  <strong>{set.title}</strong>
                  <span style={{ color: "#666", fontSize: "0.85rem", marginLeft: "0.5rem" }}>
                    {set.cards.length} cards
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => loadSet(set)}
                    style={{ padding: "0.3rem 0.75rem", background: "#6c63ff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteSet(set.id)}
                    style={{ padding: "0.3rem 0.75rem", background: "#dc3545", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Upload onUpload={setFileData} />

      {fileData && !examMode && (
        <div style={{ textAlign: "right", marginBottom: "0.5rem" }}>
            <button
                onClick={() => setExamMode(true)}
                style={{ padding: "0.5rem 1rem", background: "#ff6b6b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
            >
                Exam Mode
            </button>
        </div>
        )}

        {fileData && examMode && (
            <ExamMode fileData={fileData} onExit={() => setExamMode(false)} />
        )}

        {fileData && !examMode && (
            <ChapterSelect
            fileData={fileData}
            onGenerate={(cards) => {
            setFlashcards(cards)
            setCurrentCard(0)
            setFlipped(false)
            fetchSavedSets()
            }}
            />
        )}


      {flashcards.length > 0 && (
        <div>
          <Flashcard
            card={flashcards[currentCard]}
            flipped={flipped}
            onFlip={() => setFlipped(!flipped)}
          />
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
            <button
              onClick={() => { setCurrentCard(Math.max(0, currentCard - 1)); setFlipped(false) }}
              disabled={currentCard === 0}
            >
              Previous
            </button>
            <span>{currentCard + 1} / {flashcards.length}</span>
            <button
              onClick={() => { setCurrentCard(Math.min(flashcards.length - 1, currentCard + 1)); setFlipped(false) }}
              disabled={currentCard === flashcards.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App