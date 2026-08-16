import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const login = (userData) => {
    if (userData.githubToken) {
      localStorage.setItem('github_token', userData.githubToken)
    }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
    if (user?.provider === 'google' || user?.provider === 'github') {
      const { logout: firebaseLogout } = await import('../lib/firebase')
      await firebaseLogout()
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('github_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)