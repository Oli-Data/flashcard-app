import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token"))

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }
  }, [token])

  const login = async (email, password) => {
    const res = await axios.post("http://127.0.0.1:8000/auth/login", { email, password })
    const t = res.data.access_token
    localStorage.setItem("token", t)
    setToken(t)
    setUser(email)
    axios.defaults.headers.common["Authorization"] = `Bearer ${t}`
  }

  const register = async (email, password) => {
    const res = await axios.post("http://127.0.0.1:8000/auth/register", { email, password })
    const t = res.data.access_token
    localStorage.setItem("token", t)
    setToken(t)
    setUser(email)
    axios.defaults.headers.common["Authorization"] = `Bearer ${t}`
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common["Authorization"]
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}