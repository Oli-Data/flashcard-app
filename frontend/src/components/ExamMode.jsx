import { useState } from "react"
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
      setFinished(true)
    } else {
      setCurrentQ(q => q + 1)
      setSelected(null)
      setSubmitted(false)
    }
  }

  const getOptionStyle = (index) => {
    const base = {
      width: "100%",
      padding: "0.75rem 1rem",
      marginBottom: "0.5rem",
      borderRadius: "8px",
      border: "1px solid #ccc",
      cursor: submitted ? "default" : "pointer",
      textAlign: "left",
      fontSize: "1rem",
      background: "white",
      transition: "all 0.2s"
    }

    if (!submitted) {
      if (index === selected) {
        return { ...base, background: "#e8e4ff", border: "2px solid #6c63ff" }
      }
      return base
    }

    // After submit
    if (index === questions[currentQ].correct_index) {
      return { ...base, background: "#d4edda", border: "2px solid #28a745" }
    }
    if (index === selected && selected !== questions[currentQ].correct_index) {
      return { ...base, background: "#f8d7da", border: "2px solid #dc3545" }
    }
    return base
  }

  // Setup screen
  if (questions.length === 0) {
    return (
      <div style={{ border: "1px solid #ccc", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Exam Mode</h2>
          <button onClick={onExit} style={{ padding: "0.4rem 1rem", cursor: "pointer" }}>Back</button>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <label>Chapter:</label>
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", marginTop: "0.25rem" }}
          >
            {fileData.chapters.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label>Number of questions: {numQuestions}</label>
          <input
            type="range"
            min="5"
            max="20"
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
            style={{ width: "100%", marginBottom: "1rem" }}
          />

          <button
            onClick={startExam}
            disabled={loading}
            style={{ width: "100%", padding: "0.75rem", background: "#6c63ff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" }}
          >
            {loading ? "Generating exam..." : "Start Exam"}
          </button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      </div>
    )
  }

  // Results screen
  if (finished) {
    const percentage = Math.round((score / questions.length) * 100)
    return (
      <div style={{ border: "1px solid #ccc", padding: "1.5rem", borderRadius: "8px" }}>
        <h2 style={{ textAlign: "center" }}>Exam Complete</h2>
        <p style={{ textAlign: "center", fontSize: "2rem", fontWeight: "bold", color: percentage >= 70 ? "#28a745" : "#dc3545" }}>
          {score}/{questions.length} ({percentage}%)
        </p>

        <h3>Review:</h3>
        {results.map((r, i) => (
          <div key={i} style={{ padding: "0.75rem", marginBottom: "0.5rem", borderRadius: "8px", background: r.correct ? "#d4edda" : "#f8d7da" }}>
            <p style={{ margin: 0, fontWeight: "bold" }}>{r.question}</p>
            {!r.correct && <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem" }}>Your answer: {r.selected}</p>}
            {!r.correct && <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "#28a745" }}>Correct: {r.answer}</p>}
          </div>
        ))}

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button
            onClick={() => { setQuestions([]); setFinished(false) }}
            style={{ flex: 1, padding: "0.75rem", background: "#6c63ff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
          >
            New Exam
          </button>
          <button
            onClick={onExit}
            style={{ flex: 1, padding: "0.75rem", cursor: "pointer", borderRadius: "8px" }}
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
    <div style={{ border: "1px solid #ccc", padding: "1.5rem", borderRadius: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <span style={{ color: "#666" }}>Question {currentQ + 1} of {questions.length}</span>
        <span style={{ color: "#666" }}>Score: {score}</span>
      </div>

      <p style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "1.5rem" }}>{q.question}</p>

      {q.options.map((option, index) => (
        <button
          key={index}
          onClick={() => handleSelect(index)}
          style={getOptionStyle(index)}
        >
          {String.fromCharCode(65 + index)}. {option}
        </button>
      ))}

      {selected !== null && !submitted && (
        <button
          onClick={handleSubmit}
          style={{ width: "100%", padding: "0.75rem", background: "#6c63ff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "1rem", fontSize: "1rem" }}
        >
          Submit Answer
        </button>
      )}

      {submitted && (
        <button
          onClick={handleNext}
          style={{ width: "100%", padding: "0.75rem", background: "#28a745", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "1rem", fontSize: "1rem" }}
        >
          {currentQ + 1 >= questions.length ? "See Results" : "Next Question"}
        </button>
      )}
    </div>
  )
}

export default ExamMode