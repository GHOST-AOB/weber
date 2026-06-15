'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, Spinner } from '@/app/components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (isSignUp) {
      // Sign up with email confirmation disabled for testing
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (result.error) {
        setError(result.error.message)
        setLoading(false)
      } else if (result.data?.session === null) {
        // Email confirmation required
        setSuccess('Account created! Check your email for the confirmation link.')
        setLoading(false)
      } else {
        // Auto-confirmed (email confirmation disabled)
        router.push('/dashboard')
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      
      if (authError) {
        setError(authError.message)
        setLoading(false)
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#212121] mb-2">Weber</h1>
          <p className="text-[#757575]">Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={setFullName}
              placeholder="Enter your name"
            />
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="Enter your email"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
              setSuccess('')
            }}
            className="text-sm text-[#1976D2] hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-[#757575]">
          Integrated with Spider Web
        </p>
      </Card>
    </div>
  )
}