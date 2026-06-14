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
      <div className="flex justify-center w-full">
        <div className="flex bg-white/30 p-1.5 rounded-full border border-white/40 shadow-sm backdrop-blur-md w-full max-w-sm md:w-auto">
          {([
            { id: 'main', label: 'Portal', icon: LayoutDashboard },
            { id: 'about', label: 'About', icon: Info },
            { id: 'how', label: 'How to Use', icon: HelpCircle },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-8 py-3 text-xs md:text-sm font-bold uppercase tracking-widest rounded-full transition-all",
                activeTab === tab.id ? "bg-white text-charcoal shadow-md scale-105" : "text-warm-grey/60 hover:text-charcoal"
              )}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
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
