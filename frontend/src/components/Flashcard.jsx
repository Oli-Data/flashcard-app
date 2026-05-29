function Flashcard({ card, flipped, onFlip }) {
  return (
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
  )
}

export default Flashcard