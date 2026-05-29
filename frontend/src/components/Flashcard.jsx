import { useState } from "react"

function Flashcard({ card, flipped, onFlip }) {
  const [showSource, setShowSource] = useState(false)

  return (
    <div>
      <div
        onClick={onFlip}
        style={{
          border: "1px solid #ccc",
          borderRadius: "12px",
          padding: "3rem 2rem",
          textAlign: "center",
          cursor: "pointer",
          minHeight: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: flipped ? "#6c63ff" : "white",
          color: flipped ? "white" : "black",
          fontSize: "1.2rem",
          transition: "background 0.3s",
          userSelect: "none"
        }}
      >
        <div>
          <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "1rem" }}>
            {flipped ? "Answer" : "Question — click to flip"}
          </p>
          <p>{flipped ? card.answer : card.question}</p>
        </div>
      </div>

      {card.source_quote && (
        <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
          <button
            onClick={() => setShowSource(!showSource)}
            style={{
              background: "none",
              border: "1px solid #6c63ff",
              color: "#6c63ff",
              padding: "0.4rem 1rem",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "0.85rem"
            }}
          >
            {showSource ? "Hide Source" : "View Source"}
          </button>

          {showSource && (
            <div style={{
              marginTop: "0.5rem",
              padding: "1rem",
              background: "#f9f9f9",
              borderLeft: "4px solid #6c63ff",
              borderRadius: "4px",
              textAlign: "left",
              fontSize: "0.9rem",
              color: "#444",
              fontStyle: "italic"
            }}>
              "{card.source_quote}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Flashcard