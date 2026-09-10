import { createContext, useContext, useMemo, useState } from 'react'
import api from '../lib/api'

const STORAGE_KEY = 'ventasfix.user'
const AuthContext = createContext(null)

function readStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [loading, setLoading] = useState(false)

  async function login(credentials) {
    setLoading(true)
    try {
      const { data } = await api.post('/login', credentials)
      setUser(data.usuario)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data.usuario))
      return data.usuario
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No pudimos iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try {
      await api.post('/logout')
    } catch {
      // Clear local access even when the API is unavailable.
    } finally {
      setUser(null)
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
