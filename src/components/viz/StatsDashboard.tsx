'use client'

import React, { useMemo } from 'react'
import { AffectiveStats } from '@/lib/utils/statistics'
import { Annotation, RASA_CONFIGS, RasaLabel } from '@/types/database'
import { GlassCard } from '../ui/GlassCard'
import { TrendingUp, Users, Layers, Zap, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsDashboardProps {
  text: string
  annotations: Annotation[]
  studentCount?: number
}

export default function StatsDashboard({ text, annotations, studentCount = 1 }: StatsDashboardProps) {
  const stats = useMemo(() => new AffectiveStats(text.length, annotations, studentCount), [text, annotations, studentCount])
  
  const distribution = useMemo(() => stats.getDistribution().filter(d => d.uniqueCharacterCount > 0), [stats])
  const spikes = useMemo(() => stats.getPositionalSpikes(), [stats])
  const coOccurrences = useMemo(() => stats.getTopCoOccurrences(), [stats])
  const coverage = useMemo(() => stats.getCoverageMetrics(), [stats])
  const contested = useMemo(() => stats.getContestedSegments(), [stats])

  function renderSentenceWithHighlights(fragment: string, anns: Annotation[]) {
    // Group characters by their unique set of annotations
    const points = new Set<number>([0, fragment.length])
    anns.forEach(a => {
      points.add(a.start_offset)
      points.add(a.end_offset)
    })
    const sortedPoints = Array.from(points).sort((a, b) => a - b)
    const groups: { text: string, anns: Annotation[] }[] = []

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const s = sortedPoints[i]
      const e = sortedPoints[i + 1]
      const fragmentText = fragment.substring(s, e)
      const segmentAnns = anns.filter(a => a.start_offset <= s && a.end_offset >= e)
      groups.push({ text: fragmentText, anns: segmentAnns })
    }

    return groups.map((group, i) => {
      if (group.anns.length === 0) return <span key={i}>{group.text}</span>
      let element = <>{group.text}</>
      group.anns.forEach((ann) => {
        element = (
          <span 
            key={ann.id}
            style={{
              backgroundColor: RASA_CONFIGS[ann.rasa_label].color,
              mixBlendMode: 'multiply',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
              padding: '0.1em 0',
              borderRadius: '2px',
              opacity: 0.8
            }}
            className="inline"
          >
            {element}
          </span>
        )
      })
      return <span key={i} className="inline leading-normal">{element}</span>
    })
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20">
      {/* 1. Global Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GlassCard className="p-8 flex flex-col items-center justify-center text-center space-y-2 border-white/40">
          <span className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em]">Overall Coverage</span>
          <span className="text-5xl font-light text-charcoal">{Math.round(coverage.percentage)}%</span>
          <p className="text-xs text-warm-grey font-light">of the text has been Landmark-ed</p>
        </GlassCard>

        <GlassCard className="p-8 flex flex-col items-center justify-center text-center space-y-2 border-white/40">
          <span className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em]">Engagement spikes</span>
          <span className="text-5xl font-light text-charcoal">{spikes.length}</span>
          <p className="text-xs text-warm-grey font-light">moments of intense emotional reaction</p>
        </GlassCard>

        <GlassCard className="p-8 flex flex-col items-center justify-center text-center space-y-2 border-white/40">
          <span className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em]">Affective Complexity</span>
          <span className="text-5xl font-light text-charcoal">{coOccurrences.length}</span>
          <p className="text-xs text-warm-grey font-light">pairs of emotions frequently overlapping</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* 2. Emotion Distribution */}
        <GlassCard className="p-10 space-y-8 border-white/40">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-terracotta" />
            <h3 className="text-2xl text-charcoal font-normal">Emotion Distribution</h3>
          </div>
          <div className="space-y-6">
            {distribution.sort((a, b) => b.uniqueCharacterCount - a.uniqueCharacterCount).map(item => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-charcoal font-medium">{item.name}</span>
                  </div>
                  <span className="text-warm-grey">{Math.round(item.textCoverage)}% of text</span>
                </div>
                <div className="h-2 w-full bg-charcoal/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000"
                    style={{ 
                      width: `${item.totalAffectShare}%`, 
                      backgroundColor: item.color,
                      opacity: 0.8
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 3. Emotional Spikes (Decile Analysis) */}
        <GlassCard className="p-10 space-y-8 border-white/40">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-terracotta" />
            <h3 className="text-2xl text-charcoal font-normal">Emotional Intensity Map</h3>
          </div>
          <div className="flex items-end justify-between gap-1 h-32 px-2 border-b border-charcoal/5">
            {Array.from({ length: 10 }).map((_, i) => {
              const spike = spikes.find(s => s.binIndex === i)
              return (
                <div 
                  key={i} 
                  className="flex-1 rounded-t-lg transition-all duration-700 relative group"
                  style={{ 
                    height: spike ? `${Math.min(100, (spike.intensity / 4) * 100)}%` : '10%',
                    backgroundColor: spike ? RASA_CONFIGS[spike.emotions[0]].color : '#2A262205'
                  }}
                >
                  {spike && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                      <div className="bg-charcoal text-white text-[9px] px-2 py-1 rounded whitespace-nowrap uppercase tracking-widest">
                        {spike.emotions.map(e => RASA_CONFIGS[e].name).join(' + ')}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[8px] font-black text-warm-grey/40 uppercase tracking-[0.2em] px-1">
            <span>Start</span>
            <span>Middle</span>
            <span>Finish</span>
          </div>
          <p className="text-xs text-warm-grey leading-relaxed italic">
            Bars indicate where specific emotions &quot;spiked&quot; significantly above their average occurrence.
          </p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* 4. Co-occurrence Matrix Highlights */}
        <GlassCard className="p-10 space-y-8 border-white/40">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-terracotta" />
            <h3 className="text-2xl text-charcoal font-normal">Affective Overlaps</h3>
          </div>
          <div className="space-y-4">
            {coOccurrences.map((co, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-white/20 p-4 rounded-2xl border border-white/40">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: RASA_CONFIGS[co.emotionA].color }} />
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: RASA_CONFIGS[co.emotionB].color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-charcoal font-medium">
                    {RASA_CONFIGS[co.emotionA].name} + {RASA_CONFIGS[co.emotionB].name}
                  </p>
                  <p className="text-xs text-warm-grey">
                    {Math.round(co.overlapPercentage)}% of {RASA_CONFIGS[co.emotionA].name} overlapped with {RASA_CONFIGS[co.emotionB].name}
                  </p>
                </div>
              </div>
            ))}
            {coOccurrences.length === 0 && (
              <p className="text-center text-warm-grey py-10 italic">No emotional overlaps detected yet.</p>
            )}
          </div>
        </GlassCard>

        {/* 5. Classroom Contestedness (Aggregation) */}
        <GlassCard className="p-10 space-y-8 border-white/40">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-terracotta" />
            <h3 className="text-2xl text-charcoal font-normal">Discussion Starters</h3>
          </div>
          <div className="space-y-6">
            {contested.map((seg, idx) => {
              // Find sentence boundaries
              let sentenceStart = seg.start
              while (sentenceStart > 0 && !/[.!?\n]/.test(text[sentenceStart - 1])) {
                sentenceStart--
              }
              let sentenceEnd = seg.end
              while (sentenceEnd < text.length && !/[.!?\n]/.test(text[sentenceEnd])) {
                sentenceEnd++
              }
              if (sentenceEnd < text.length && /[.!?]/.test(text[sentenceEnd])) {
                sentenceEnd++
              }

              const sentenceText = text.substring(sentenceStart, sentenceEnd).trim()
              
              const relevantAnns = seg.annotations.map(ann => ({
                ...ann,
                start_offset: Math.max(0, ann.start_offset - sentenceStart),
                end_offset: Math.min(sentenceText.length, ann.end_offset - sentenceStart)
              })).filter(a => a.end_offset > a.start_offset)

              return (
                <div key={idx} className="space-y-4 bg-white/20 p-8 rounded-[32px] border border-white/40 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em]">Contested Passage #{idx + 1}</span>
                    <div className="flex items-center gap-2 bg-charcoal/5 px-3 py-1 rounded-full border border-charcoal/5">
                      <span className="text-[10px] font-bold text-warm-grey uppercase tracking-widest">Diversity:</span>
                      <span className="text-[10px] font-black text-charcoal">{Math.round(seg.diversityIndex * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="text-lg text-charcoal/90 leading-relaxed font-serif italic selection:bg-terracotta/20">
                    &quot;{renderSentenceWithHighlights(sentenceText, relevantAnns)}&quot;
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-charcoal/5 mt-4">
                    {seg.labels.map(l => (
                      <div key={l.label} className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-full text-[10px] font-bold text-charcoal/60 border border-white/80 shadow-sm">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RASA_CONFIGS[l.label].color }} />
                        {RASA_CONFIGS[l.label].name} ({l.count})
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {studentCount <= 1 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                <Info className="w-8 h-8 text-warm-grey/20" />
                <p className="text-sm text-warm-grey/60 max-w-[200px]">
                  Contestedness metrics require multiple student perspectives.
                </p>
              </div>
            ) : contested.length === 0 && (
              <p className="text-center text-warm-grey py-10 italic">The class is currently in complete emotional agreement.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
