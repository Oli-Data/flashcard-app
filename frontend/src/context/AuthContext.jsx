import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const AuthContext = createContext()

/**
 * AuthProvider wraps the app and provides authentication state
 * and methods (login, register, logout) to all child components.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Persist token in localStorage so user stays logged in on refresh
  const [token, setToken] = useState(localStorage.getItem("token"))

  // Set Authorization header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }
  }, [token])

  const login = async (email, password) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, { email, password })
    const t = res.data.access_token
    localStorage.setItem("token", t)
    setToken(t)
    setUser(email)
    axios.defaults.headers.common["Authorization"] = `Bearer ${t}`
  }

  const register = async (email, password) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, { email, password })
    const t = res.data.access_token
    localStorage.setItem("token", t)
    setToken(t)
    setUser(email)
    axios.defaults.headers.common["Authorization"] = `Bearer ${t}`
  }

  const logout = () => {
    // Clear token from storage and remove Authorization header
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

/**
 * useAuth hook for accessing auth context in any component
 */
export function useAuth() {
  return useContext(AuthContext)
}