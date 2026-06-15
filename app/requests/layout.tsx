'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/app/components/layout/sidebar'
import { Spinner } from '@/app/components/ui'

export default function RequestsLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}