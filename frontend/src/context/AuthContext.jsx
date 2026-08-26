import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState(localStorage.getItem("username"))
  const [friendCode, setFriendCode] = useState(localStorage.getItem("friend_code"))
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }
  }, [token])

  // On first load, validate any stored token against the backend and
  // restore the session instead of always dropping the user back to the
  // login screen on refresh. If the token is missing, invalid, or expired,
  // the stored session is cleared and the user sees the login screen.
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("token")
      if (!storedToken) {
        setLoading(false)
        return
      }
      try {
        axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`)
        setUser(res.data.email)
        setUsername(res.data.username)
        setFriendCode(res.data.friend_code)
        setToken(storedToken)
      } catch (err) {
        localStorage.removeItem("token")
        localStorage.removeItem("username")
        localStorage.removeItem("friend_code")
        delete axios.defaults.headers.common["Authorization"]
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  const login = async (email, password) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, { email, password })
    const t = res.data.access_token
    localStorage.setItem("token", t)
    localStorage.setItem("username", res.data.username)
    localStorage.setItem("friend_code", res.data.friend_code)
    setToken(t)
    setUser(email)
    setUsername(res.data.username)
    setFriendCode(res.data.friend_code)
    axios.defaults.headers.common["Authorization"] = `Bearer ${t}`
  }

  const register = async (email, username, password) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, { email, username, password })
    const t = res.data.access_token
    localStorage.setItem("token", t)
    localStorage.setItem("username", res.data.username)
    localStorage.setItem("friend_code", res.data.friend_code)
    setToken(t)
    setUser(email)
    setUsername(res.data.username)
    setFriendCode(res.data.friend_code)
    axios.defaults.headers.common["Authorization"] = `Bearer ${t}`
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    localStorage.removeItem("friend_code")
    setToken(null)
    setUser(null)
    setUsername(null)
    setFriendCode(null)
    delete axios.defaults.headers.common["Authorization"]
  }

  return (
    <AuthContext.Provider value={{ user, username, friendCode, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
