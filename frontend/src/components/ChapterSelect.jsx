import { useState } from "react"
import axios from "axios"

function ChapterSelect({ fileData, onGenerate }) {
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
      const res = await axios.post("http://127.0.0.1:8000/flashcards/generate", {
        file_path: fileData.file_path,
        chapter: selectedChapter,
        num_cards: numCards
      })
      setCurrentCards(res.data.flashcards)
      setSetTitle(selectedChapter)
      onGenerate(res.data.flashcards)
    } catch (err) {
      setError("Failed to generate flashcards. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentCards) return
    setSaving(true)
    setSavedMessage(null)

    try {
      await axios.post("http://127.0.0.1:8000/sets/save", {
        title: setTitle || selectedChapter,
        chapter: selectedChapter,
        cards: currentCards
      })
      setSavedMessage("Set saved successfully!")
    } catch (err) {
      setError("Failed to save set.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
      <h2>Select Chapter</h2>
      <select
        value={selectedChapter}
        onChange={(e) => setSelectedChapter(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
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
        style={{ width: "100%", padding: "0.75rem", background: "#6c63ff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem", marginBottom: "0.5rem" }}
      >
        {loading ? "Generating flashcards..." : "Generate Flashcards"}
      </button>

      {currentCards && (
        <div>
          <input
            type="text"
            placeholder="Name this set..."
            value={setTitle}
            onChange={(e) => setSetTitle(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", background: "#28a745", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" }}
          >
            {saving ? "Saving..." : "Save This Set"}
          </button>
        </div>
      )}

      {savedMessage && <p style={{ color: "green", textAlign: "center" }}>{savedMessage}</p>}
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
    </div>
  )
}

export default ChapterSelect