'use client'

import React, { useState, useRef, useMemo } from 'react'
import { RASA_CONFIGS, RasaLabel, Annotation, Student } from '@/types/database'
import { GlassCard } from '@/components/ui/GlassCard'

interface SpectrumProps {
  text: string
  annotations: Annotation[]
  students: Student[]
  title?: string
}

interface TooltipState {
  x: number
  y: number
  content: {
    studentName: string
    emotion: string
    passage: string
    agreement?: string
  }
}

export default function SpectrumVisualizer({ text, annotations, students }: SpectrumProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const textLength = text.length
  const BAND_HEIGHT = 40
  const BAND_GAP = 4
  const LABEL_WIDTH = 180
  const MARGIN_RIGHT = 40

  // 1. Calculate Majority Emotion for Consolidated View
  const consensusData = useMemo(() => {
    if (textLength === 0) return []
    
    // Character-by-character frequency map
    const charMap = Array.from({ length: textLength }, () => ({} as Record<string, number>))
    
    annotations.forEach(ann => {
      for (let i = ann.start_offset; i < ann.end_offset; i++) {
        if (i < textLength) {
          charMap[i][ann.rasa_label] = (charMap[i][ann.rasa_label] || 0) + 1
        }
      }
    })

    const segments: { start: number, end: number, label: RasaLabel, agreement: number }[] = []
    let currentSegment: { start: number, label: RasaLabel, agreement: number } | null = null

    charMap.forEach((freqs, i) => {
      const sorted = Object.entries(freqs).sort((a, b) => b[1] - a[1])
      const majority = sorted[0] // [label, count]
      
      const majorityLabel = majority ? (majority[0] as RasaLabel) : null
      const agreement = majority ? majority[1] : 0

      if (!currentSegment || currentSegment.label !== majorityLabel || currentSegment.agreement !== agreement) {
        if (currentSegment && currentSegment.label) {
          segments.push({ ...currentSegment, end: i })
        }
        currentSegment = majorityLabel ? { start: i, label: majorityLabel, agreement } : null
      }
    })
    
    if (currentSegment && currentSegment.label) {
      segments.push({ ...currentSegment, end: textLength })
    }

    return segments
  }, [annotations, textLength])

  const handleMouseMove = (e: React.MouseEvent, content: TooltipState['content']) => {
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      content
    })
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 select-none" ref={containerRef}>
      {/* 1. Consolidated View (The "Hero" Band) */}
      <GlassCard className="p-10 shadow-lg border-white/40 overflow-hidden relative bg-white/40">
        <h3 className="text-3xl text-charcoal mb-2 font-normal flex items-center justify-between">
          Consensus Spectrum
          <span className="text-[10px] font-bold text-warm-grey/40 tracking-[0.2em] uppercase">Majority Emotion</span>
        </h3>
        <p className="text-lg text-warm-grey mb-12 font-light">
          Aggregated emotional landscape across the entire class.
        </p>

        <div className="relative overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-charcoal/10 scrollbar-track-transparent">
          <div style={{ minWidth: LABEL_WIDTH + textLength + MARGIN_RIGHT }}>
            <svg 
              width={LABEL_WIDTH + textLength + MARGIN_RIGHT} 
              height={80} 
              viewBox={`0 0 ${LABEL_WIDTH + textLength + MARGIN_RIGHT} 80`}
              className="w-full"
            >
              <g transform={`translate(${LABEL_WIDTH}, 10)`}>
                {consensusData.map((seg, i) => (
                  <rect
                    key={i}
                    x={seg.start}
                    y={0}
                    width={seg.end - seg.start}
                    height={60}
                    fill={RASA_CONFIGS[seg.label].color}
                    opacity={0.3 + (seg.agreement / students.length) * 0.7}
                    onMouseMove={(e) => handleMouseMove(e, {
                      studentName: 'Class Majority',
                      emotion: RASA_CONFIGS[seg.label].name,
                      passage: text.substring(seg.start, seg.end),
                      agreement: `${seg.agreement}/${students.length} students`
                    })}
                    onMouseLeave={() => setTooltip(null)}
                    className="cursor-crosshair transition-opacity duration-300"
                  />
                ))}
              </g>
            </svg>
          </div>
        </div>
      </GlassCard>

      {/* 2. Individual Spectrum (The "Barcode" Stacks) */}
      <GlassCard className="p-10 shadow-lg border-white/40 overflow-hidden relative bg-white/40">
        <h3 className="text-3xl text-charcoal mb-12 font-normal flex items-center justify-between">
          Student Spectrum
          <span className="text-[10px] font-bold text-warm-grey/40 tracking-[0.2em] uppercase">Individual Journeys</span>
        </h3>

        <div className="relative overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-charcoal/10 scrollbar-track-transparent">
          <div style={{ minWidth: LABEL_WIDTH + textLength + MARGIN_RIGHT }}>
            <svg 
              width={LABEL_WIDTH + textLength + MARGIN_RIGHT} 
              height={students.length * (BAND_HEIGHT + BAND_GAP) + 60} 
              viewBox={`0 0 ${LABEL_WIDTH + textLength + MARGIN_RIGHT} ${students.length * (BAND_HEIGHT + BAND_GAP) + 60}`}
              className="w-full"
            >
              {students.map((student, sIdx) => {
                const studentAnns = annotations.filter(a => a.student_id === student.id)
                const y = sIdx * (BAND_HEIGHT + BAND_GAP)

                return (
                  <g key={student.id} transform={`translate(0, ${y})`}>
                    {/* Name Label */}
                    <text
                      x={LABEL_WIDTH - 20}
                      y={BAND_HEIGHT / 2}
                      textAnchor="end"
                      alignmentBaseline="middle"
                      className="fill-charcoal font-bold text-sm uppercase tracking-wider font-sans"
                    >
                      {student.name}
                    </text>

                    {/* Band Background */}
                    <rect 
                      x={LABEL_WIDTH} 
                      y={0} 
                      width={textLength} 
                      height={BAND_HEIGHT} 
                      fill="#FDFBF7"
                      className="opacity-50"
                    />

                    {/* Emotion Stripes */}
                    <g transform={`translate(${LABEL_WIDTH}, 0)`}>
                      {studentAnns.map((ann) => (
                        <rect
                          key={ann.id}
                          x={ann.start_offset}
                          y={0}
                          width={ann.end_offset - ann.start_offset}
                          height={BAND_HEIGHT}
                          fill={RASA_CONFIGS[ann.rasa_label].color}
                          style={{ mixBlendMode: 'multiply' }}
                          className="opacity-60 cursor-crosshair hover:opacity-100 transition-opacity"
                          onMouseMove={(e) => handleMouseMove(e, {
                            studentName: student.name,
                            emotion: RASA_CONFIGS[ann.rasa_label].name,
                            passage: text.substring(ann.start_offset, ann.end_offset)
                          })}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      ))}
                    </g>
                  </g>
                )
              })}

              {/* Progression Arrow */}
              <g transform={`translate(${LABEL_WIDTH}, ${students.length * (BAND_HEIGHT + BAND_GAP) + 30})`}>
                <line 
                  x1={0} y1={0} x2={textLength} y2={0} 
                  stroke="#2A2622" strokeWidth={1} strokeDasharray="4 4" 
                />
                <path d={`M ${textLength - 10} -5 L ${textLength} 0 L ${textLength - 10} 5`} fill="none" stroke="#2A2622" strokeWidth={1} />
                <text 
                  x={textLength / 2} y={20} 
                  textAnchor="middle" 
                  className="fill-warm-grey text-[10px] font-bold uppercase tracking-[0.3em]"
                >
                  Progression
                </text>
              </g>
            </svg>
          </div>
        </div>
      </GlassCard>

      {/* Custom Tooltip */}
      {tooltip && (
        <div 
          className="fixed z-[100] pointer-events-none transition-transform duration-75 ease-out"
          style={{ 
            left: tooltip.x + 20, 
            top: tooltip.y,
            transform: 'translate(0, -50%)'
          }}
        >
          <div className="bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl p-6 rounded-2xl max-w-sm animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em] mb-1">
                  {tooltip.content.studentName}
                </span>
                <span className="text-xl font-normal text-charcoal">
                  {tooltip.content.emotion}
                </span>
              </div>
              {tooltip.content.agreement && (
                <span className="glass bg-charcoal/5 px-2 py-1 rounded-md text-[9px] font-bold text-charcoal/60 uppercase">
                  {tooltip.content.agreement}
                </span>
              )}
            </div>
            <div className="h-px bg-charcoal/5 mb-4" />
            <p className="text-sm leading-relaxed text-charcoal/80 font-serif italic line-clamp-6">
              &quot;{tooltip.content.passage.length > 200 ? tooltip.content.passage.substring(0, 197) + '...' : tooltip.content.passage}&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

