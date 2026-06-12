'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, Info, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Orb } from '@/components/ui/Orb'
import { supabase } from '@/lib/supabase/client'
import { TeacherPinGuard } from '@/components/auth/TeacherPinGuard'

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex atmospheric-bg overflow-hidden">
      {/* Glass Sidebar */}
      <aside className="w-80 glass m-6 rounded-[28px] flex flex-col p-8 space-y-10 h-[calc(100vh-3rem)] sticky top-6">
        <div className="flex items-center space-x-4 px-2">
          <Orb size="md" className="shrink-0" />
          <span className="text-xl font-bold tracking-tight text-charcoal leading-none">
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
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <TeacherPinGuard>
            {children}
          </TeacherPinGuard>
        </div>
      </main>
    </div>
  )
}
