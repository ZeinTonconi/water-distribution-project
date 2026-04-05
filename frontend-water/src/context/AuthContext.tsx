import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type User } from '../types'
import { loginUser, registerUser } from '../services/authService'

interface AuthContextType {
  user: User | null
  login: (name: string, password: string) => Promise<void>
  register: (name: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback(async (name: string, password: string) => {
    const data = await loginUser(name, password)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify({ id: data.user_id, name: data.name }))
    setUser({ id: data.user_id, name: data.name })
  }, [])

  const register = useCallback(async (name: string, password: string) => {
    const data = await registerUser(name, password)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify({ id: data.user_id, name: data.name }))
    setUser({ id: data.user_id, name: data.name })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}