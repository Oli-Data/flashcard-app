import { useState } from "react"
import { useAuth } from "../context/AuthContext"

function Auth() {
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password)
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #6c63ff 0%, #3f3d56 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "sans-serif"
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "2.5rem",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ margin: 0, fontSize: "2rem", color: "#6c63ff" }}>Lumitodee</h1>
          <p style={{ margin: "0.5rem 0 0", color: "#666", fontSize: "0.95rem" }}>
            AI-powered flashcards from your textbooks
          </p>
        </div>

        <div style={{ display: "flex", marginBottom: "1.5rem", borderRadius: "8px", overflow: "hidden", border: "1px solid #eee" }}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              padding: "0.6rem",
              border: "none",
              cursor: "pointer",
              background: isLogin ? "#6c63ff" : "white",
              color: isLogin ? "white" : "#666",
              fontWeight: isLogin ? "bold" : "normal",
              transition: "all 0.2s"
            }}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              padding: "0.6rem",
              border: "none",
              cursor: "pointer",
              background: !isLogin ? "#6c63ff" : "white",
              color: !isLogin ? "white" : "#666",
              fontWeight: !isLogin ? "bold" : "normal",
              transition: "all 0.2s"
            }}
          >
            Sign Up
          </button>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1rem",
            borderRadius: "8px",
            border: "1px solid #ddd",
            boxSizing: "border-box",
            fontSize: "1rem"
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1rem",
            borderRadius: "8px",
            border: "1px solid #ddd",
            boxSizing: "border-box",
            fontSize: "1rem"
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.85rem",
            background: "#6c63ff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            transition: "opacity 0.2s",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Loading..." : isLogin ? "Login" : "Create Account"}
        </button>

        {error && (
          <p style={{ color: "#dc3545", textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
            {error}
          </p>
        )}

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "#999", fontSize: "0.8rem" }}>
          Upload any PDF, DOCX, or EPUB and generate flashcards instantly.
        </p>
      </div>
    </div>
  )
}

export default Auth