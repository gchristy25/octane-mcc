'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import {
  LayoutDashboard,
  Mail,
  Calendar,
  CheckSquare,
  Bell,
  Film,
  Settings,
  LogOut,
  Loader2,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Mission Control', icon: LayoutDashboard },
  { href: '/communications', label: 'Communications', icon: Mail },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/films', label: 'Films', icon: Film },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function DashboardSidebar() {
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="w-64 h-screen bg-[#111] border-r border-[#222] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#ff9900] animate-spin" />
      </div>
    )
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  return (
    <aside className="w-64 h-screen bg-[#111] border-r border-[#222] flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-[#222]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ff9900] flex items-center justify-center">
            <span className="text-black font-bold text-sm">O</span>
          </div>
          <div>
            <h1 className="font-bold text-[#ededed] text-sm tracking-wider">OCTANE MCC</h1>
            <p className="text-[10px] text-[#666] tracking-wider">MASTER CONTROL</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#ff9900]/10 text-[#ff9900] border border-[#ff9900]/20'
                  : 'text-[#888] hover:text-[#ededed] hover:bg-[#1a1a1a]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-[#222]">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#ededed] truncate">
              {user.full_name}
            </p>
            <p className="text-xs text-[#666] truncate">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-[#888] hover:text-[#ef4444] transition-colors rounded-lg hover:bg-[#1a1a1a]"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <DashboardSidebar />
        <main className="flex-1 ml-64 p-8">{children}</main>
      </div>
    </AuthProvider>
  )
}
