'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

type UserRole = 'admin' | 'team_member' | 'client'

interface WeberUser {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  organization_id: string | null
  client_id: string | null
}

interface AuthContextType {
  user: User | null
  weberUser: WeberUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [weberUser, setWeberUser] = useState<WeberUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const refreshUser = async () => {
    if (user) {
      try {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
        if (data) {
          setWeberUser(data as WeberUser)
        }
      } catch {
        // Table might not exist, use auth metadata
        setWeberUser({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
          role: 'team_member',
          organization_id: null,
          client_id: null,
        })
      }
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        try {
          const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single()
          if (data) {
            setWeberUser(data as WeberUser)
          }
        } catch {
          // Use auth metadata
          setWeberUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || null,
            role: 'team_member',
            organization_id: null,
            client_id: null,
          })
        }
      } else {
        setWeberUser(null)
      }
      
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user,
      weberUser,
      loading,
      signIn,
      signOut,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}