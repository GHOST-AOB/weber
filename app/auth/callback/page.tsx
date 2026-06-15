'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/app/components/ui'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing your authentication...')

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      
      // Check if there's a code in the URL (email confirmation)
      const code = new URLSearchParams(window.location.search).get('code')
      
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            setStatus('Error: ' + error.message)
          } else {
            setStatus('Success! Redirecting to dashboard...')
            setTimeout(() => {
              router.push('/dashboard')
            }, 1000)
          }
        } catch (err) {
          setStatus('Authentication failed. Please try again.')
        }
      } else {
        // No code - try to get session directly
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setStatus('Success! Redirecting to dashboard...')
          setTimeout(() => {
            router.push('/dashboard')
          }, 1000)
        } else {
          setStatus('No authentication token found. Please try signing in again.')
        }
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-[#757575]">{status}</p>
      </div>
    </div>
  )
}