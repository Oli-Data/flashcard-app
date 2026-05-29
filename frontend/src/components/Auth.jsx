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
    <div style={{ maxWidth: "400px", margin: "4rem auto", padding: "2rem", border: "1px solid #ccc", borderRadius: "12px" }}>
      <h2 style={{ textAlign: "center" }}>{isLogin ? "Login" : "Sign Up"}</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ width: "100%", padding: "0.75rem", background: "#6c63ff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" }}
      >
        {loading ? "Loading..." : isLogin ? "Login" : "Sign Up"}
      </button>

      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      <p style={{ textAlign: "center", marginTop: "1rem" }}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <span
          onClick={() => setIsLogin(!isLogin)}
          style={{ color: "#6c63ff", cursor: "pointer" }}
        >
          {isLogin ? "Sign Up" : "Login"}
        </span>
      </p>
    </div>
  )
}

export default Auth