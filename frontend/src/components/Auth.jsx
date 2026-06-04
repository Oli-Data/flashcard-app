import { useState } from "react"
import { useAuth } from "../context/AuthContext"

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  html, body { margin: 0; padding: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-body {
    min-height: 100vh;
    margin: 0;
    padding: 0;
    background: #0a1628;
    background-image: 
      radial-gradient(ellipse at 20% 20%, rgba(0, 180, 200, 0.18) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 10%, rgba(80, 40, 180, 0.2) 0%, transparent 45%),
      radial-gradient(ellipse at 60% 80%, rgba(0, 150, 180, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 10% 70%, rgba(20, 80, 160, 0.15) 0%, transparent 40%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Sans', sans-serif;
  }

  .auth-card {
    width: 100%;
    max-width: 420px;
    background: rgba(0, 180, 210, 0.06);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(0, 220, 240, 0.15);
    border-radius: 24px;
    padding: 2.5rem;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
    position: relative;
    overflow: hidden;
    margin: 2rem;
  }

  .auth-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,220,240,0.4), transparent);
  }

  .auth-logo {
    font-family: 'Syne', sans-serif;
    font-size: 2rem;
    font-weight: 800;
    background: linear-gradient(135deg, #00e5ff, #40a9ff, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
    margin-bottom: 0.5rem;
  }

  .auth-tagline {
    text-align: center;
    color: rgba(200, 235, 245, 0.4);
    font-size: 0.88rem;
    font-weight: 300;
    margin-bottom: 2rem;
  }

  .auth-tabs {
    display: flex;
    margin-bottom: 1.75rem;
    background: rgba(0,0,0,0.2);
    border-radius: 10px;
    padding: 0.25rem;
    border: 1px solid rgba(0,220,240,0.08);
  }

  .auth-tab {
    flex: 1;
    padding: 0.55rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .auth-tab.active {
    background: rgba(0, 180, 220, 0.2);
    color: #00e5ff;
    border: 1px solid rgba(0,220,240,0.25);
    box-shadow: 0 2px 12px rgba(0,180,220,0.15);
  }

  .auth-tab.inactive {
    background: transparent;
    color: rgba(200,240,255,0.35);
  }

  .auth-tab.inactive:hover { color: rgba(200,240,255,0.6); }

  .auth-input {
    width: 100%;
    padding: 0.75rem 1rem;
    margin-bottom: 0.85rem;
    background: rgba(0, 180, 210, 0.06);
    border: 1px solid rgba(0, 220, 240, 0.15);
    border-radius: 10px;
    color: #e8f4f8;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.92rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }

  .auth-input:focus {
    border-color: rgba(0, 220, 240, 0.4);
    box-shadow: 0 0 0 3px rgba(0, 200, 240, 0.08);
  }

  .auth-input::placeholder { color: rgba(200,235,245,0.25); }

  .auth-btn {
    width: 100%;
    padding: 0.85rem;
    background: linear-gradient(135deg, rgba(0,150,200,0.8), rgba(100,80,220,0.8));
    color: #e0f4ff;
    border: 1px solid rgba(0,200,240,0.2);
    border-radius: 10px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(0,150,220,0.2);
    margin-top: 0.25rem;
  }

  .auth-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,150,220,0.3); }
  .auth-btn:disabled { opacity: 0.6; cursor: default; transform: none; }

  .auth-error {
    color: #f87171;
    text-align: center;
    font-size: 0.85rem;
    margin-top: 0.75rem;
  }

  .auth-footer {
    text-align: center;
    margin-top: 1.75rem;
    color: rgba(200,235,245,0.25);
    font-size: 0.78rem;
    line-height: 1.6;
  }

  .auth-features {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .auth-feature {
    text-align: center;
    color: rgba(200,235,245,0.3);
    font-size: 0.75rem;
  }

  .auth-feature-icon {
    display: block;
    font-size: 1.2rem;
    margin-bottom: 0.25rem;
  }
`

function Auth() {
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
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
        if (!username.trim()) {
          setError("Username is required")
          setLoading(false)
          return
        }
        await register(email, username, password)
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="auth-body">
        <div className="auth-card">
          <div className="auth-logo">Lumnitudy</div>
          <p className="auth-tagline">AI-powered flashcards from your textbooks</p>

          <div className="auth-tabs">
            <button className={`auth-tab ${isLogin ? "active" : "inactive"}`} onClick={() => setIsLogin(true)}>
              Login
            </button>
            <button className={`auth-tab ${!isLogin ? "active" : "inactive"}`} onClick={() => setIsLogin(false)}>
              Sign Up
            </button>
          </div>

          <input
            className="auth-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {!isLogin && (
            <input
              className="auth-input"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}

          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Loading..." : isLogin ? "Login" : "Create Account"}
          </button>

          {error && <p className="auth-error">{error}</p>}

          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">📄</span>
              PDF, DOCX, EPUB
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🤖</span>
              AI Generated
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">✅</span>
              Source Verified
            </div>
          </div>

          <p className="auth-footer">Your study materials are private and secure.</p>
        </div>
      </div>
    </>
  )
}

export default Auth