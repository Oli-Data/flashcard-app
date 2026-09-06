import { useState } from "react"
import axios from "axios"

function ChapterSelect({ fileData, onGenerate, onExamMode, onKahoot }) {
  const [selectedChapter, setSelectedChapter] = useState(fileData.chapters[0])
  const [numCards, setNumCards] = useState(10)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedMessage, setSavedMessage] = useState(null)
  const [currentCards, setCurrentCards] = useState(null)
  const [setTitle, setSetTitle] = useState("")

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setSavedMessage(null)
    setCurrentCards(null)

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/flashcards/generate`, {
        file_path: fileData.file_path,
        chapter: selectedChapter,
        num_cards: numCards
      })
      setCurrentCards(res.data.flashcards)
      setSetTitle(selectedChapter)
      onGenerate(res.data.flashcards)
    } catch (err) {
      setError(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Failed to generate flashcards. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentCards) return
    setSaving(true)
    setSavedMessage(null)

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/sets/save`, {
        title: setTitle || selectedChapter,
        chapter: selectedChapter,
        cards: currentCards
      })
      setSavedMessage("Set saved successfully!")
    } catch {
      setError("Failed to save set.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: "rgba(0, 180, 210, 0.06)",
      backdropFilter: "blur(24px)",
      border: "1px solid rgba(0, 220, 240, 0.12)",
      borderRadius: "18px",
      padding: "1.5rem",
      marginBottom: "1.25rem",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(0,220,240,0.3), transparent)"
      }} />

      <p style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: "0.72rem",
        fontWeight: 700,
        color: "rgba(0, 220, 240, 0.5)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: "1rem"
      }}>Select Chapter</p>

      <select
        value={selectedChapter}
        onChange={(e) => setSelectedChapter(e.target.value)}
        style={{ marginBottom: "1rem" }}
      >
        {fileData.chapters.map((chapter) => (
          <option key={chapter} value={chapter}>{chapter}</option>
        ))}
      </select>

      <label>Number of flashcards: {numCards}</label>
      <input
        type="range"
        min="5"
        max="20"
        value={numCards}
        onChange={(e) => setNumCards(parseInt(e.target.value))}
        style={{ width: "100%", marginBottom: "1rem" }}
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          width: "100%",
          padding: "0.8rem",
          background: "linear-gradient(135deg, rgba(0,150,200,0.7), rgba(100,80,220,0.7))",
          color: "#e0f4ff",
          border: "1px solid rgba(0,200,240,0.2)",
          borderRadius: "10px",
          cursor: "pointer",
          fontSize: "0.95rem",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          marginBottom: "0.5rem",
          transition: "all 0.2s"
        }}
      >
        {loading ? "Generating flashcards..." : "Generate Flashcards"}
      </button>

      {currentCards && (
        <div style={{ marginTop: "0.75rem" }}>
          <input
            type="text"
            placeholder="Name this set..."
            value={setTitle}
            onChange={(e) => setSetTitle(e.target.value)}
            style={{ marginBottom: "0.5rem" }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "linear-gradient(135deg, rgba(0,180,100,0.7), rgba(0,160,80,0.7))",
              color: "#aff5d0",
              border: "1px solid rgba(0,220,120,0.3)",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              transition: "all 0.2s"
            }}
          >
            {saving ? "Saving..." : "Save This Set"}
          </button>
        </div>
      )}

      {savedMessage && <p style={{ color: "#aff5d0", textAlign: "center", marginTop: "0.75rem", fontSize: "0.88rem" }}>{savedMessage}</p>}
      {error && <p style={{ color: "#f87171", textAlign: "center", marginTop: "0.75rem", fontSize: "0.88rem" }}>{error}</p>}

      <div style={{
        marginTop: "1rem",
        paddingTop: "1rem",
        borderTop: "1px solid rgba(0,220,240,0.08)",
        display: "flex",
        justifyContent: "flex-end",
        gap: "0.5rem"
      }}>
        <button
          onClick={onKahoot}
          style={{
            padding: "0.6rem 1.4rem",
            background: "linear-gradient(135deg, rgba(234,179,8,0.8), rgba(249,115,22,0.8))",
            color: "white",
            border: "1px solid rgba(255,200,100,0.3)",
            borderRadius: "9px",
            cursor: "pointer",
            fontSize: "0.88rem",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            transition: "all 0.2s"
          }}
        >
          🎮 Kahoot
        </button>
        <button
          onClick={onExamMode}
          style={{
            padding: "0.6rem 1.4rem",
            background: "linear-gradient(135deg, rgba(249,115,22,0.8), rgba(239,68,68,0.8))",
            color: "white",
            border: "1px solid rgba(255,150,100,0.3)",
            borderRadius: "9px",
            cursor: "pointer",
            fontSize: "0.88rem",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            boxShadow: "0 4px 16px rgba(239,68,68,0.2)",
            transition: "all 0.2s"
          }}
        >
          Exam Mode
        </button>
      </div>
    </div>
  )
}

export default ChapterSelect
