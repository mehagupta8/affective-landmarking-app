'use client'

import { useState } from 'react'
import { AboutContent } from './AboutContent'
import { HowToUseContent } from './HowToUseContent'
import { cn } from '@/lib/utils'
import { GlassCard } from '../ui/GlassCard'
import { Info, HelpCircle, LayoutDashboard } from 'lucide-react'

interface InfoTabsProps {
  mainContent: React.ReactNode
}

export function InfoTabs({ mainContent }: InfoTabsProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'about' | 'how'>('main')

  return (
    <div className="w-full space-y-12">
      <div className="flex justify-center">
        <div className="flex bg-white/30 p-1.5 rounded-full border border-white/40 shadow-sm backdrop-blur-md">
          <button
            onClick={() => setActiveTab('main')}
            className={cn(
              "flex items-center gap-2 px-8 py-3 text-sm font-bold uppercase tracking-widest rounded-full transition-all",
              activeTab === 'main' ? "bg-white text-charcoal shadow-md scale-105" : "text-warm-grey/60 hover:text-charcoal"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Portal
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={cn(
              "flex items-center gap-2 px-8 py-3 text-sm font-bold uppercase tracking-widest rounded-full transition-all",
              activeTab === 'about' ? "bg-white text-charcoal shadow-md scale-105" : "text-warm-grey/60 hover:text-charcoal"
            )}
          >
            <Info className="w-4 h-4" />
            About
          </button>
          <button
            onClick={() => setActiveTab('how')}
            className={cn(
              "flex items-center gap-2 px-8 py-3 text-sm font-bold uppercase tracking-widest rounded-full transition-all",
              activeTab === 'how' ? "bg-white text-charcoal shadow-md scale-105" : "text-warm-grey/60 hover:text-charcoal"
            )}
          >
            <HelpCircle className="w-4 h-4" />
            How to Use
          </button>
        </div>
      </div>

      <div className="animate-in fade-in zoom-in duration-500">
        {activeTab === 'main' && mainContent}
        {activeTab === 'about' && (
          <GlassCard className="p-12 md:p-20 shadow-xl border-white/60">
            <AboutContent />
          </GlassCard>
        )}
        {activeTab === 'how' && (
          <div className="py-10">
            <HowToUseContent />
          </div>
        )}
      </div>
    </div>
  )
}
