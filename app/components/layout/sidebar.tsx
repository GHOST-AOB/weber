'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Avatar } from '@/app/components/ui'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/projects', label: 'Projects', icon: '📁' },
  { href: '/tasks', label: 'Tasks', icon: '✓' },
  { href: '/requests', label: 'Requests', icon: '🎫' },
  { href: '/invoices', label: 'Invoices', icon: '💰' },
  { href: '/clients', label: 'Clients', icon: '👥' },
  { href: '/team', label: 'Team', icon: '👤', roles: ['admin', 'team_member'] as const },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { weberUser, signOut } = useAuth()

  const filteredNav = navItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(weberUser?.role as 'admin' | 'team_member')
  })

  return (
    <aside className="w-64 bg-[#1A1A1A] text-white flex flex-col h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-[#424242]">
        <Link href="/dashboard" className="text-xl font-bold">
          Weber
        </Link>
        <p className="text-xs text-[#BDBDBD] mt-1">Management System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNav.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-[#1976D2] text-white' 
                  : 'text-[#BDBDBD] hover:bg-[#424242] hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-[#424242]">
        <div className="flex items-center gap-3 mb-3">
          <Avatar 
            name={weberUser?.full_name || 'User'} 
            size="sm" 
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{weberUser?.full_name || 'User'}</p>
            <p className="text-xs text-[#BDBDBD] capitalize">{weberUser?.role?.replace('_', ' ') || 'Member'}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full px-4 py-2 text-sm text-[#BDBDBD] hover:text-white hover:bg-[#424242] rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}