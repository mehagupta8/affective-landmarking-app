'use client'

import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, BookOpen, Settings, LogOut, Info, HelpCircle, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Orb } from '@/components/ui/Orb'
import { supabase } from '@/lib/supabase/client'
import { TeacherAuthGuard } from '@/components/auth/TeacherAuthGuard'

const navItems = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
  { label: 'Texts', href: '/teacher/texts', icon: BookOpen },
  { label: 'About', href: '/teacher/about', icon: Info },
  { label: 'How to Use', href: '/teacher/how-to-use', icon: HelpCircle },
  { label: 'Settings', href: '/teacher/settings', icon: Settings },
]

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isPublicRoute = pathname === '/teacher/login' ||
                        pathname?.startsWith('/teacher/login/') ||
                        pathname === '/teacher/signup' ||
                        pathname?.startsWith('/teacher/signup/')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (isPublicRoute) return <>{children}</>

  const NavContent = () => (
    <>
      <div className="flex flex-col items-center text-center space-y-4 px-2">
        <Orb size="lg" className="shrink-0" />
        <span className="text-xl font-bold tracking-[0.1em] text-charcoal uppercase leading-tight">
          Affective<br />Landmarking
        </span>
      </div>

      <nav className="flex-1 space-y-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label + item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center space-x-4 px-5 py-4 rounded-full transition-all duration-500 group",
                isActive
                  ? "bg-white/60 text-charcoal shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-white/40"
                  : "text-warm-grey hover:bg-white/30 hover:text-charcoal"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-terracotta")} />
              <span className="text-base font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center space-x-4 px-5 py-4 rounded-full text-warm-grey/60 hover:bg-white/40 hover:text-red-500 transition-all duration-500 group"
      >
        <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
        <span className="text-base font-medium">Sign Out</span>
      </button>
    </>
  )

  return (
    <div className="min-h-screen atmospheric-bg md:flex md:overflow-hidden">

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 glass border-b border-white/30 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Orb size="sm" />
          <span className="text-sm font-bold tracking-[0.1em] text-charcoal uppercase">Affective Landmarking</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-full hover:bg-white/40 transition-colors"
        >
          <Menu className="w-5 h-5 text-charcoal" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 glass m-3 rounded-[28px] flex flex-col p-8 space-y-10 h-[calc(100vh-1.5rem)] z-10 animate-in slide-in-from-left duration-300">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/40 transition-colors"
            >
              <X className="w-4 h-4 text-warm-grey" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-80 glass m-6 rounded-[28px] flex-col p-8 space-y-12 h-[calc(100vh-3rem)] sticky top-6">
        <NavContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-12 overflow-y-auto min-h-0">
        <div className="max-w-6xl mx-auto">
          <TeacherAuthGuard>
            {children}
          </TeacherAuthGuard>
        </div>
      </main>
    </div>
  )
}
