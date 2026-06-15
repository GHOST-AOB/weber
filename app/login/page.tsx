'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button, Input, Card, Spinner } from '@/app/components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await signIn(email, password)
    
    if (authError) {
      setError(authError.message)
      setLoading(false)
    }
    // On success, the auth context will update and redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#212121] mb-2">Weber</h1>
          <p className="text-[#757575]">Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <p className="text-sm text-[#F44336]">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : 'Sign In'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#757575]">
          Integrated with Spider Web
        </p>
      </Card>
    </div>
  )
}