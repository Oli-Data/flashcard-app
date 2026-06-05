import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useAuth } from "../context/AuthContext"

function Kahoot({ fileData, onExit }) {
  const { username } = useAuth()
  const [mode, setMode] = useState("menu") // menu, lobby, game, results
  const [gameCode, setGameCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [players, setPlayers] = useState([])
  const [isHost, setIsHost] = useState(false)
  const [question, setQuestion] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [answerResult, setAnswerResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [finalLeaderboard, setFinalLeaderboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [numQuestions, setNumQuestions] = useState(10)
  const [selectedChapter, setSelectedChapter] = useState(fileData?.chapters[0])
  const [totalScore, setTotalScore] = useState(0)
  const [isLastQuestion, setIsLastQuestion] = useState(false)

  const wsRef = useRef(null)
  const timerRef = useRef(null)
  const questionStartRef = useRef(null)

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const connectWebSocket = (code, asHost) => {
    const wsUrl = `${import.meta.env.VITE_API_URL.replace("https", "wss").replace("http", "ws")}/game/ws/${code}/${username}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setMode("lobby")
      setIsHost(asHost)
      setGameCode(code)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleMessage(data)
    }

    ws.onerror = () => {
      setError("Connection failed. Please try again.")
      setMode("menu")
    }

    ws.onclose = () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const handleMessage = (data) => {
    switch (data.type) {
      case "player_joined":
      case "player_left":
        setPlayers(data.players)
        break

      case "question":
        setShowLeaderboard(false)
        setQuestion(data)
        setQuestionIndex(data.index)
        setTotalQuestions(data.total)
        setTimeLeft(data.time_limit)
        setSelected(null)
        setAnswered(false)
        setAnswerResult(null)
        questionStartRef.current = Date.now()
        setMode("game")

        // Start countdown timer
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        break

      case "answer_result":
        setAnswerResult(data)
        setTotalScore(data.total_score)
        break

      case "question_result":
        console.log("question_result received:", data)
        clearInterval(timerRef.current)
        setLeaderboard(data.leaderboard)
        setShowLeaderboard(true)
        setIsLastQuestion(data.is_last)
        break

    case "ping":
        if (wsRef.current) wsRef.current.send(JSON.stringify({ type: "pong" }))
        break
      
    case "game_over":
        clearInterval(timerRef.current)
        setShowLeaderboard(false)
        setFinalLeaderboard(data.leaderboard)
        setMode("results")
        break

      case "error":
        setError(data.message)
        setMode("menu")
        break
    }
  }

  const createGame = async () => {
    if (!fileData) {
      setError("Please upload a textbook first")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/game/create`, {
        file_path: fileData.file_path,
        chapter: selectedChapter,
        num_questions: numQuestions
      })
      connectWebSocket(res.data.game_code, true)
    } catch (err) {
      setError("Failed to create game. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const joinGame = () => {
    if (!joinCode.trim()) return
    setError(null)
    connectWebSocket(joinCode.toUpperCase(), false)
  }

  const startGame = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "start_game" }))
    }
  }

  const submitAnswer = (index) => {
    if (answered) return
    setSelected(index)
    setAnswered(true)
    clearInterval(timerRef.current)
    const timeTaken = (Date.now() - questionStartRef.current) / 1000
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: "submit_answer",
        answer_index: index,
        time_taken: timeTaken
      }))
    }
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

  const btnPrimary = {
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
    transition: "all 0.2s",
    marginBottom: "0.5rem"
  }

  // Menu screen
  if (mode === "menu") {
    return (
      <div style={glassPanel}>
        <div style={topLine} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <p style={{ ...panelTitle, marginBottom: 0 }}>Kahoot Mode</p>
          <button onClick={onExit} style={{
            padding: "0.4rem 1rem",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(200,240,255,0.65)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem"
          }}>Back</button>
        </div>

        {/* Host section */}
        {fileData && (
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={panelTitle}>Host a Game</p>
            <label style={{ color: "rgba(200,235,245,0.55)", fontSize: "0.88rem", display: "block", marginBottom: "0.4rem" }}>Chapter:</label>
            <select value={selectedChapter} onChange={(e) => setSelectedChapter(e.target.value)} style={{ marginBottom: "0.75rem" }}>
              {fileData.chapters.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label style={{ color: "rgba(200,235,245,0.55)", fontSize: "0.88rem", display: "block", marginBottom: "0.4rem" }}>
              Questions: {numQuestions}
            </label>
            <input type="range" min="5" max="20" value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              style={{ width: "100%", marginBottom: "0.75rem", accentColor: "#00e5ff" }}
            />
            <button onClick={createGame} disabled={loading} style={btnPrimary}>
              {loading ? "Creating game..." : "🎮 Create Game"}
            </button>
          </div>
        )}

        {/* Join section */}
        <div>
          <p style={panelTitle}>Join a Game</p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Enter game code (e.g. GAME-AB12)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinGame()}
              style={{ flex: 1 }}
            />
            <button onClick={joinGame} style={{
              padding: "0.65rem 1.1rem",
              background: "rgba(0,180,220,0.2)",
              color: "#00e5ff",
              border: "1px solid rgba(0,220,240,0.3)",
              borderRadius: "9px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem",
              whiteSpace: "nowrap"
            }}>Join</button>
          </div>
        </div>

        {error && <p style={{ color: "#f87171", marginTop: "0.75rem", fontSize: "0.88rem" }}>{error}</p>}
      </div>
    )
  }

  // Lobby screen
  if (mode === "lobby") {
    return (
      <div style={glassPanel}>
        <div style={topLine} />
        <p style={panelTitle}>Game Lobby</p>

        <div style={{
          textAlign: "center",
          padding: "1rem",
          background: "rgba(0,0,0,0.2)",
          borderRadius: "12px",
          marginBottom: "1.25rem",
          border: "1px solid rgba(0,220,240,0.1)"
        }}>
          <p style={{ color: "rgba(200,235,245,0.4)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>Game Code</p>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "2rem", fontWeight: 800, color: "#00e5ff", letterSpacing: "0.15em" }}>{gameCode}</p>
          <p style={{ color: "rgba(200,235,245,0.3)", fontSize: "0.8rem", marginTop: "0.25rem" }}>Share this code with your friends</p>
        </div>

        <p style={panelTitle}>Players ({players.length})</p>
        <div style={{ marginBottom: "1.25rem" }}>
          {players.map((p, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.6rem 0",
              borderBottom: "1px solid rgba(0,200,220,0.07)"
            }}>
              <div style={{
                width: "28px", height: "28px",
                background: "linear-gradient(135deg, #00e5ff, #a78bfa)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 700, color: "#0a1628", flexShrink: 0
              }}>
                {p[0].toUpperCase()}
              </div>
              <span style={{ color: "#e0f0f8", fontSize: "0.9rem" }}>
                {p} {p === gameCode.split("-")[0] ? "" : ""}
                {players[0] === p ? <span style={{ color: "rgba(0,220,240,0.5)", fontSize: "0.75rem", marginLeft: "0.4rem" }}>HOST</span> : ""}
              </span>
            </div>
          ))}
        </div>

        {isHost ? (
          <button
            onClick={startGame}
            disabled={players.length < 1}
            style={{
              ...btnPrimary,
              background: "linear-gradient(135deg, rgba(249,115,22,0.8), rgba(239,68,68,0.8))",
              border: "1px solid rgba(255,150,100,0.3)"
            }}
          >
            🚀 Start Game
          </button>
        ) : (
          <p style={{ textAlign: "center", color: "rgba(200,235,245,0.4)", fontSize: "0.88rem" }}>
            Waiting for host to start...
          </p>
        )}
      </div>
    )
  }

  // Game screen
  if (mode === "game") {
    const colors = [
      { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", color: "#f87171" },
      { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", color: "#60a5fa" },
      { bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.4)", color: "#fbbf24" },
      { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.4)", color: "#4ade80" },
    ]

    const shapes = ["▲", "◆", "●", "■"]

    if (showLeaderboard) {
      return (
        <div style={glassPanel}>
          <div style={topLine} />
          <p style={{ ...panelTitle, textAlign: "center" }}>Leaderboard</p>
          {leaderboard.map((entry, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.75rem 1rem", marginBottom: "0.5rem", borderRadius: "10px",
              background: i === 0 ? "rgba(255,200,0,0.08)" : "rgba(0,180,210,0.04)",
              border: `1px solid ${i === 0 ? "rgba(255,200,0,0.2)" : "rgba(0,220,240,0.08)"}`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "rgba(200,235,245,0.4)"
                }}>#{i + 1}</span>
                <span style={{ color: "#e8f4f8", fontSize: "0.9rem" }}>{entry.username}</span>
              </div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#00e5ff" }}>
                {entry.score}
              </span>
            </div>
          ))}
          <p style={{ textAlign: "center", color: "rgba(200,235,245,0.3)", fontSize: "0.82rem", marginTop: "0.75rem" }}>
            {isLastQuestion ? "Game ending..." : "Next question coming up..."}
            </p> 
        </div>
      )
    }

    return (
      <div style={glassPanel}>
        <div style={topLine} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span style={{ color: "rgba(200,235,245,0.4)", fontSize: "0.82rem", fontFamily: "'Syne', sans-serif" }}>
            {questionIndex + 1} / {totalQuestions}
          </span>
          <div style={{
            width: "44px", height: "44px",
            borderRadius: "50%",
            background: timeLeft <= 5 ? "rgba(239,68,68,0.2)" : "rgba(0,180,210,0.1)",
            border: `2px solid ${timeLeft <= 5 ? "rgba(239,68,68,0.5)" : "rgba(0,220,240,0.3)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            color: timeLeft <= 5 ? "#f87171" : "#00e5ff",
            fontSize: "1.1rem",
            transition: "all 0.3s"
          }}>
            {timeLeft}
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", color: "#00e5ff", fontSize: "0.85rem" }}>
            {totalScore} pts
          </span>
        </div>

        {/* Question */}
        <div style={{
          background: "rgba(0,0,0,0.2)",
          borderRadius: "12px",
          padding: "1.25rem",
          marginBottom: "1rem",
          border: "1px solid rgba(0,220,240,0.08)",
          textAlign: "center"
        }}>
          <p style={{ color: "#e8f4f8", fontSize: "1.05rem", fontWeight: 500, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
            {question?.question}
          </p>
        </div>

        {/* Answer result */}
        {answerResult && (
          <div style={{
            textAlign: "center",
            padding: "0.75rem",
            marginBottom: "0.75rem",
            borderRadius: "10px",
            background: answerResult.correct ? "rgba(0,180,100,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${answerResult.correct ? "rgba(0,220,120,0.3)" : "rgba(239,68,68,0.3)"}`
          }}>
            <p style={{ color: answerResult.correct ? "#aff5d0" : "#f87171", fontWeight: 600, fontSize: "0.95rem" }}>
              {answerResult.correct ? `+${answerResult.points_earned} points!` : "Wrong!"}
            </p>
          </div>
        )}

        {/* Options grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
          {question?.options.map((option, index) => {
            const c = colors[index]
            const isSelected = selected === index
            return (
              <button
                key={index}
                onClick={() => submitAnswer(index)}
                disabled={answered}
                style={{
                  padding: "1rem 0.75rem",
                  background: isSelected ? c.bg : "rgba(0,0,0,0.15)",
                  border: `2px solid ${isSelected ? c.border : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "12px",
                  cursor: answered ? "default" : "pointer",
                  color: isSelected ? c.color : "rgba(200,235,245,0.6)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.88rem",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  textAlign: "left"
                }}
              >
                <span style={{ fontSize: "1rem", opacity: 0.7 }}>{shapes[index]}</span>
                {option}
              </button>
            )
          })}
        </div>

        {answered && !answerResult && (
          <p style={{ textAlign: "center", color: "rgba(200,235,245,0.3)", fontSize: "0.82rem", marginTop: "0.75rem" }}>
            Waiting for other players...
          </p>
        )}
      </div>
    )
  }

  // Results screen
  if (mode === "results" && finalLeaderboard) {
    return (
      <div style={glassPanel}>
        <div style={topLine} />
        <h2 style={{ textAlign: "center", fontFamily: "'Syne', sans-serif", color: "#e8f4f8", marginBottom: "0.5rem" }}>
          Game Over!
        </h2>
        {finalLeaderboard[0] && (
          <p style={{ textAlign: "center", color: "#ffd700", fontFamily: "'Syne', sans-serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem" }}>
            🏆 {finalLeaderboard[0].username} wins!
          </p>
        )}

        <p style={panelTitle}>Final Scores</p>
        {finalLeaderboard.map((entry, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "0.75rem 1rem", marginBottom: "0.5rem", borderRadius: "10px",
            background: i === 0 ? "rgba(255,200,0,0.08)" : "rgba(0,180,210,0.04)",
            border: `1px solid ${i === 0 ? "rgba(255,200,0,0.2)" : "rgba(0,220,240,0.08)"}`
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.1rem",
                color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "rgba(200,235,245,0.4)"
              }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </span>
              <span style={{ color: "#e8f4f8", fontSize: "0.95rem" }}>{entry.username}</span>
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#00e5ff", fontSize: "1rem" }}>
              {entry.score}
            </span>
          </div>
        ))}

        <button onClick={onExit} style={{ ...btnPrimary, marginTop: "1rem" }}>
          Back to Study
        </button>
      </div>
    )
  }

  return null
}

export default Kahoot
