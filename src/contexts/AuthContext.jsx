import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

// Simple authentication configuration
const AUTH_CONFIG = {
  // Default credentials (in production, this would be handled server-side)
  defaultUsername: 'correia',
  defaultPassword: 'metals2024',
  recoveryEmail: 'd***@g***.com', // Masked version of donaldcnorth@gmail.com
  actualRecoveryEmail: 'donaldcnorth@gmail.com', // Hidden from UI
  sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionData = localStorage.getItem('correia_session')
        if (sessionData) {
          const { timestamp, user: sessionUser } = JSON.parse(sessionData)
          const now = Date.now()
          
          // Check if session is still valid
          if (now - timestamp < AUTH_CONFIG.sessionTimeout) {
            setIsAuthenticated(true)
            setUser(sessionUser)
          } else {
            // Session expired, clear it
            localStorage.removeItem('correia_session')
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
        localStorage.removeItem('correia_session')
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (username, password) => {
    try {
      // Simple credential check (in production, this would be server-side)
      if (username === AUTH_CONFIG.defaultUsername && password === AUTH_CONFIG.defaultPassword) {
        const userData = {
          username: username,
          role: 'owner',
          loginTime: new Date().toISOString()
        }

        // Store session
        const sessionData = {
          timestamp: Date.now(),
          user: userData
        }
        localStorage.setItem('correia_session', JSON.stringify(sessionData))

        setIsAuthenticated(true)
        setUser(userData)
        return { success: true }
      } else {
        return { 
          success: false, 
          error: 'Invalid credentials. Please contact support if you need assistance.' 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Authentication error. Please try again.' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('correia_session')
    setIsAuthenticated(false)
    setUser(null)
  }

  const requestPasswordReset = () => {
    // In a real application, this would send an email
    return {
      success: true,
      message: `Password reset instructions have been sent to ${AUTH_CONFIG.recoveryEmail}`
    }
  }

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    requestPasswordReset,
    recoveryEmail: AUTH_CONFIG.recoveryEmail
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

