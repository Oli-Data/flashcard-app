import { useState, useEffect } from "react"
import axios from "axios"

function ExamMode({ fileData, onExit }) {
  const [selectedChapter, setSelectedChapter] = useState(fileData.chapters[0])
  const [numQuestions, setNumQuestions] = useState(10)
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState([])
  const [finished, setFinished] = useState(false)
  const [error, setError] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const startExam = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/flashcards/exam`, {
        file_path: fileData.file_path,
        chapter: selectedChapter,
        num_questions: numQuestions
      })
      setQuestions(res.data.questions)
      setCurrentQ(0)
      setScore(0)
      setResults([])
      setFinished(false)
      setSelected(null)
      setSubmitted(false)
      setShowLeaderboard(false)
    } catch (err) {
      setError("Failed to generate exam. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (index) => {
    if (submitted) return
    setSelected(index)
  }

  const handleSubmit = () => {
    if (selected === null) return
    setSubmitted(true)
    const correct = selected === questions[currentQ].correct_index
    if (correct) setScore(s => s + 1)
    setResults(r => [...r, {
      question: questions[currentQ].question,
      correct: correct,
      selected: questions[currentQ].options[selected],
      answer: questions[currentQ].options[questions[currentQ].correct_index]
    }])
  }

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      const finalScore = results.filter(r => r.correct).length + (selected === questions[currentQ].correct_index ? 1 : 0)
      setFinished(true)
      submitScore(finalScore, questions.length)
      fetchLeaderboard()
    } else {
      setCurrentQ(q => q + 1)
      setSelected(null)
      setSubmitted(false)
    }
  }

  const submitScore = async (finalScore, total) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/scores/`, {
        chapter: selectedChapter,
        score: finalScore,
        total: total
      })
    } catch (err) {
    console.error("Failed to submit score")
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/scores/${encodeURIComponent(selectedChapter)}`)
      setLeaderboard(res.data)
    } catch (err) {
      console.error("Failed to fetch leaderboard")
    }
  }

  const getOptionStyle = (index) => {
    const base = {
      width: "100%",
      padding: "0.85rem 1.1rem",
      marginBottom: "0.6rem",
      borderRadius: "10px",
      border: "1px solid rgba(0, 220, 240, 0.15)",
      cursor: submitted ? "default" : "pointer",
      textAlign: "left",
      fontSize: "0.95rem",
      fontFamily: "'DM Sans', sans-serif",
      background: "rgba(0, 180, 210, 0.04)",
      color: "#e8f4f8",
      transition: "all 0.2s"
    }

    if (!submitted) {
      if (index === selected) {
        return { ...base, background: "rgba(124, 111, 255, 0.15)", border: "2px solid rgba(124, 111, 255, 0.5)", color: "#e0d4ff" }
      }
      return base
    }

    if (index === questions[currentQ].correct_index) {
      return { ...base, background: "rgba(0, 180, 100, 0.15)", border: "2px solid rgba(0, 220, 120, 0.5)", color: "#aff5d0" }
    }
    if (index === selected && selected !== questions[currentQ].correct_index) {
      return { ...base, background: "rgba(239, 68, 68, 0.12)", border: "2px solid rgba(239, 68, 68, 0.4)", color: "#f87171" }
    }
    return base
  }

  const glassPanel = {
    background: "rgba(0, 180, 210, 0.06)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(0, 220, 240, 0.12)",
    borderRadius: "18px",
    padding: "1.5rem",
    marginBottom: "1.25rem",
    position: "relative",
    overflow: "hidden"
  }

  const topLine = {
    position: "absolute", top: 0, left: 0, right: 0, height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(0,220,240,0.3), transparent)"
  }

  const panelTitle = {
    fontFamily: "'Syne', sans-serif",
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "rgba(0, 220, 240, 0.5)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "1rem"
  }

  // Setup screen
  if (questions.length === 0) {
    return (
      <div style={glassPanel}>
        <div style={topLine} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <p style={panelTitle}>Exam Mode</p>
          <button onClick={onExit} style={{
            padding: "0.4rem 1rem",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(200,240,255,0.65)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem"
          }}>Back</button>
        </div>

        <label style={{ color: "rgba(200, 235, 245, 0.55)", fontSize: "0.88rem", display: "block", marginBottom: "0.4rem" }}>Chapter:</label>
        <select value={selectedChapter} onChange={(e) => setSelectedChapter(e.target.value)} style={{ marginBottom: "1rem" }}>
          {fileData.chapters.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label style={{ color: "rgba(200, 235, 245, 0.55)", fontSize: "0.88rem", display: "block", marginBottom: "0.4rem" }}>
          Number of questions: {numQuestions}
        </label>
        <input
          type="range" min="5" max="20" value={numQuestions}
          onChange={(e) => setNumQuestions(parseInt(e.target.value))}
          style={{ width: "100%", marginBottom: "1rem", accentColor: "#00e5ff" }}
        />

        <button onClick={startExam} disabled={loading} style={{
          width: "100%", padding: "0.8rem",
          background: "linear-gradient(135deg, rgba(0,150,200,0.7), rgba(100,80,220,0.7))",
          color: "#e0f4ff", border: "1px solid rgba(0,200,240,0.2)",
          borderRadius: "10px", cursor: "pointer", fontSize: "0.95rem",
          fontFamily: "'DM Sans', sans-serif", fontWeight: 500, transition: "all 0.2s"
        }}>
          {loading ? "Generating exam..." : "Start Exam"}
        </button>
        {error && <p style={{ color: "#f87171", marginTop: "0.75rem", fontSize: "0.88rem", textAlign: "center" }}>{error}</p>}
      </div>
    )
  }

  // Results screen
  if (finished) {
    const finalScore = results.filter(r => r.correct).length
    const percentage = Math.round((finalScore / questions.length) * 100)

    return (
      <div style={glassPanel}>
        <div style={topLine} />
        <h2 style={{ textAlign: "center", fontFamily: "'Syne', sans-serif", color: "#e8f4f8", marginBottom: "0.5rem" }}>
          Exam Complete
        </h2>
        <p style={{
          textAlign: "center", fontSize: "2.5rem", fontWeight: "bold",
          fontFamily: "'Syne', sans-serif",
          color: percentage >= 70 ? "#aff5d0" : "#f87171",
          marginBottom: "1.5rem"
        }}>
          {finalScore}/{questions.length} <span style={{ fontSize: "1.2rem", opacity: 0.7 }}>({percentage}%)</span>
        </p>

        {/* Tab toggle */}
        <div style={{ display: "flex", marginBottom: "1.25rem", background: "rgba(0,0,0,0.2)", borderRadius: "10px", padding: "0.25rem", border: "1px solid rgba(0,220,240,0.08)" }}>
          <button
            onClick={() => setShowLeaderboard(false)}
            style={{
              flex: 1, padding: "0.5rem", border: "none", borderRadius: "8px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", fontWeight: 500, transition: "all 0.2s",
              background: !showLeaderboard ? "rgba(0, 180, 220, 0.2)" : "transparent",
              color: !showLeaderboard ? "#00e5ff" : "rgba(200,240,255,0.35)"
            }}
          >
            Review
          </button>
          <button
            onClick={() => setShowLeaderboard(true)}
            style={{
              flex: 1, padding: "0.5rem", border: "none", borderRadius: "8px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", fontWeight: 500, transition: "all 0.2s",
              background: showLeaderboard ? "rgba(0, 180, 220, 0.2)" : "transparent",
              color: showLeaderboard ? "#00e5ff" : "rgba(200,240,255,0.35)"
            }}
          >
            Leaderboard
          </button>
        </div>

        {/* Review tab */}
        {!showLeaderboard && (
          <div>
            <p style={panelTitle}>Review</p>
            {results.map((r, i) => (
              <div key={i} style={{
                padding: "0.85rem 1rem", marginBottom: "0.5rem", borderRadius: "10px",
                background: r.correct ? "rgba(0,180,100,0.1)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${r.correct ? "rgba(0,220,120,0.2)" : "rgba(239,68,68,0.2)"}`
              }}>
                <p style={{ margin: 0, fontWeight: 500, color: "#e8f4f8", fontSize: "0.92rem" }}>{r.question}</p>
                {!r.correct && (
                  <>
                    <p style={{ margin: "0.4rem 0 0", fontSize: "0.82rem", color: "#f87171" }}>Your answer: {r.selected}</p>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "#aff5d0" }}>Correct: {r.answer}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard tab */}
        {showLeaderboard && (
          <div>
            <p style={panelTitle}>{selectedChapter} — Top Scores</p>
            {leaderboard.length === 0 ? (
              <p style={{ color: "rgba(200,235,245,0.3)", fontSize: "0.88rem" }}>No scores yet for this chapter.</p>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.75rem 1rem", marginBottom: "0.5rem", borderRadius: "10px",
                  background: i === 0 ? "rgba(255,200,0,0.08)" : "rgba(0,180,210,0.04)",
                  border: `1px solid ${i === 0 ? "rgba(255,200,0,0.2)" : "rgba(0,220,240,0.08)"}`
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{
                      fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem",
                      color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "rgba(200,235,245,0.4)"
                    }}>
                      #{entry.rank}
                    </span>
                    <span style={{ color: "#e8f4f8", fontSize: "0.88rem" }}>
                      {entry.username}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: "'Syne', sans-serif", fontWeight: 700,
                    color: entry.percentage >= 70 ? "#aff5d0" : "#f87171",
                    fontSize: "0.95rem"
                  }}>
                    {entry.percentage}%
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
          <button
            onClick={() => { setQuestions([]); setFinished(false) }}
            style={{
              flex: 1, padding: "0.75rem",
              background: "linear-gradient(135deg, rgba(0,150,200,0.7), rgba(100,80,220,0.7))",
              color: "#e0f4ff", border: "1px solid rgba(0,200,240,0.2)",
              borderRadius: "10px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500
            }}
          >
            New Exam
          </button>
          <button
            onClick={onExit}
            style={{
              flex: 1, padding: "0.75rem",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(200,240,255,0.65)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif"
            }}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  // Question screen
  const q = questions[currentQ]
  return (
    <div style={glassPanel}>
      <div style={topLine} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem", alignItems: "center" }}>
        <span style={{ color: "rgba(200,235,245,0.4)", fontSize: "0.82rem", fontFamily: "'Syne', sans-serif" }}>
          Question {currentQ + 1} of {questions.length}
        </span>
        <span style={{
          color: "rgba(0,220,240,0.7)", fontSize: "0.82rem", fontFamily: "'Syne', sans-serif",
          background: "rgba(0,200,220,0.08)", border: "1px solid rgba(0,220,240,0.2)",
          padding: "0.2rem 0.7rem", borderRadius: "20px"
        }}>
          Score: {score}
        </span>
      </div>

      <p style={{ fontSize: "1.05rem", fontWeight: 500, color: "#e8f4f8", marginBottom: "1.25rem", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
        {q.question}
      </p>

      {q.options.map((option, index) => (
        <button key={index} onClick={() => handleSelect(index)} style={getOptionStyle(index)}>
          <span style={{ opacity: 0.5, marginRight: "0.6rem" }}>{String.fromCharCode(65 + index)}.</span>
          {option}
        </button>
      ))}

      {selected !== null && !submitted && (
        <button onClick={handleSubmit} style={{
          width: "100%", padding: "0.8rem",
          background: "linear-gradient(135deg, rgba(0,150,200,0.7), rgba(100,80,220,0.7))",
          color: "#e0f4ff", border: "1px solid rgba(0,200,240,0.2)",
          borderRadius: "10px", cursor: "pointer", marginTop: "0.75rem",
          fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 500
        }}>
          Submit Answer
        </button>
      )}

      {submitted && (
        <button onClick={handleNext} style={{
          width: "100%", padding: "0.8rem",
          background: "linear-gradient(135deg, rgba(0,180,100,0.7), rgba(0,160,80,0.7))",
          color: "#aff5d0", border: "1px solid rgba(0,220,120,0.3)",
          borderRadius: "10px", cursor: "pointer", marginTop: "0.75rem",
          fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 500
        }}>
          {currentQ + 1 >= questions.length ? "See Results" : "Next Question"}
        </button>
      )}
    </div>
  )
}

export default ExamMode