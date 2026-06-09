'use client'

import { PillButton } from '@/components/ui/PillButton'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function StudentSignOut({ className }: { className?: string }) {
  const router = useRouter()

  const handleSignOut = async () => {
    await fetch('/api/student/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <PillButton 
      onClick={handleSignOut}
      className={`px-4 py-2 flex items-center gap-2 text-xs border-white/20 hover:bg-red-50/10 ${className}`}
    >
      <LogOut className="w-3 h-3" />
      Sign Out
    </PillButton>
  )
}
