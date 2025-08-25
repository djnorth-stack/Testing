import React, { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export const LoginForm = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showResetMessage, setShowResetMessage] = useState(false)

  const { login, requestPasswordReset, recoveryEmail } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await login(username, password)
      if (!result.success) {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = () => {
    const result = requestPasswordReset()
    if (result.success) {
      setShowResetMessage(true)
      setError('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">CORREIA</CardTitle>
          <p className="text-slate-600">Precious Metals Valuation</p>
          <p className="text-sm text-slate-500 mt-2">Secure Access Required</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showResetMessage && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Password reset instructions have been sent to {recoveryEmail}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="link"
              onClick={handlePasswordReset}
              disabled={isLoading}
              className="text-sm text-slate-600 hover:text-slate-800"
            >
              Forgot your password?
            </Button>
          </div>

          <div className="text-center text-xs text-slate-500 mt-4">
            <p>Private & Secure • Correia Precious Metals</p>
            <p className="mt-1">For support, contact: {recoveryEmail}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

