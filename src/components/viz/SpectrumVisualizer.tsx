'use client'

import React, { useState, useRef, useMemo } from 'react'
import { RASA_CONFIGS, RasaLabel, Annotation, StudentProfile } from '@/types/database'
import { GlassCard } from '@/components/ui/GlassCard'

interface SpectrumProps {
  text: string
  annotations: Annotation[]
  students: StudentProfile[]
  title?: string
}

interface TooltipEmotion {
  name: string
  color: string
  agreement?: string
}

interface TooltipState {
  x: number
  y: number
  content: {
    studentName: string
    emotions: TooltipEmotion[]
    passage: string
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

  // 1. Calculate Consensus Segments
  const consensusData = useMemo(() => {
    if (textLength === 0) return []
    
    const charMap = Array.from({ length: textLength }, () => ({} as Record<string, number>))
    annotations.forEach(ann => {
      for (let i = ann.start_offset; i < ann.end_offset; i++) {
        if (i < textLength) {
          charMap[i][ann.rasa_label] = (charMap[i][ann.rasa_label] || 0) + 1
        }
      }
    })

    const segments: { 
      start: number, 
      end: number, 
      majorityLabel: RasaLabel | null, 
      agreement: number,
      allEmotions: { label: RasaLabel, count: number }[]
    }[] = []

    let currentEmotions: { label: RasaLabel, count: number }[] = []
    let start = 0

    charMap.forEach((freqs, i) => {
      const sorted = Object.entries(freqs)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({
          label: label as RasaLabel,
          count
        }))
      
      const hash = JSON.stringify(sorted)
      const currentHash = JSON.stringify(currentEmotions)

      if (hash !== currentHash) {
        if (currentEmotions.length > 0) {
          segments.push({ 
            start, 
            end: i, 
            majorityLabel: currentEmotions[0].label,
            agreement: currentEmotions[0].count,
            allEmotions: [...currentEmotions]
          })
        }
        currentEmotions = sorted
        start = i
      }
    })
    
    if (currentEmotions.length > 0) {
      segments.push({ 
        start, 
        end: textLength, 
        majorityLabel: currentEmotions[0].label,
        agreement: currentEmotions[0].count,
        allEmotions: currentEmotions 
      })
    }

    return segments
  }, [annotations, textLength])

  // 2. Calculate Individual Student Segments
  const studentData = useMemo(() => {
    return students.map(student => {
      const studentAnns = annotations.filter(a => a.student_id === student.id)
      
      const charEmotions = Array.from({ length: textLength }, () => [] as RasaLabel[])
      studentAnns.forEach(ann => {
        for (let i = ann.start_offset; i < ann.end_offset; i++) {
          if (i < textLength) charEmotions[i].push(ann.rasa_label)
        }
      })

      const segments: { start: number, end: number, emotions: RasaLabel[] }[] = []
      let currentEmotions: RasaLabel[] = []
      let start = 0

      charEmotions.forEach((emotions, i) => {
        const hash = emotions.sort().join(',')
        const currentHash = currentEmotions.sort().join(',')

        if (hash !== currentHash) {
          if (currentEmotions.length > 0) {
            segments.push({ start, end: i, emotions: [...currentEmotions] })
          }
          currentEmotions = emotions
          start = i
        }
      })
      
      if (currentEmotions.length > 0) {
        segments.push({ start, end: textLength, emotions: [...currentEmotions] })
      }

      return {
        student,
        rawAnnotations: studentAnns,
        segments
      }
    })
  }, [annotations, students, textLength])

  const handleMouseMove = (e: React.MouseEvent, content: TooltipState['content']) => {
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      content
    })
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 select-none" ref={containerRef}>
      {/* 1. Consolidated View */}
      <GlassCard className="p-10 shadow-lg border-white/40 overflow-hidden relative bg-white/40">
        <h3 className="text-3xl text-charcoal mb-2 font-normal flex items-center justify-between">
          Consensus Spectrum
          <span className="text-[10px] font-bold text-warm-grey/40 tracking-[0.2em] uppercase">Aggregated View</span>
        </h3>
        <p className="text-lg text-warm-grey mb-12 font-light">
          Hover to see all emotions present in this segment.
        </p>

        <div className="relative overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-charcoal/10 scrollbar-track-transparent">
          <div style={{ minWidth: LABEL_WIDTH + textLength + MARGIN_RIGHT }}>
            <svg 
              width={LABEL_WIDTH + textLength + MARGIN_RIGHT} 
              height={140} 
              viewBox={`0 0 ${LABEL_WIDTH + textLength + MARGIN_RIGHT} 140`}
              className="w-full"
            >
              {/* Vertical Axis: Emotion */}
              <g transform="translate(0, 10)">
                <text
                  x={LABEL_WIDTH - 20}
                  y={30}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="fill-charcoal font-bold text-sm uppercase tracking-widest font-sans"
                >
                  Emotion
                </text>
                <line x1={LABEL_WIDTH - 10} y1={0} x2={LABEL_WIDTH - 10} y2={60} stroke="#2A2622" strokeWidth={1} strokeDasharray="4 4" />
              </g>

              {/* Spectrum Data */}
              <g transform={`translate(${LABEL_WIDTH}, 10)`}>
                {consensusData.map((seg, i) => (
                  <g key={i}>
                    {/* Visual layers for each emotion in the segment */}
                    {seg.allEmotions.map((em, emIdx) => (
                      <rect
                        key={`${i}-${emIdx}`}
                        x={seg.start}
                        y={0}
                        width={seg.end - seg.start}
                        height={60}
                        fill={RASA_CONFIGS[em.label].color}
                        style={{ mixBlendMode: 'multiply' }}
                        opacity={0.3 + (em.count / students.length) * 0.6}
                        className="pointer-events-none"
                      />
                    ))}
                    
                    {/* Hover hitbox */}
                    <rect
                      x={seg.start}
                      y={0}
                      width={seg.end - seg.start}
                      height={60}
                      fill="transparent"
                      onMouseMove={(e) => handleMouseMove(e, {
                        studentName: 'Class Consensus',
                        emotions: seg.allEmotions.map(em => ({
                          name: RASA_CONFIGS[em.label].name,
                          color: RASA_CONFIGS[em.label].color,
                          agreement: `${em.count}/${students.length} students`
                        })),
                        passage: text.substring(seg.start, seg.end)
                      })}
                      onMouseLeave={() => setTooltip(null)}
                      className="cursor-crosshair"
                    />
                  </g>
                ))}
              </g>

              {/* Horizontal Axis: Progress */}
              <g transform={`translate(${LABEL_WIDTH}, 100)`}>
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
                  Progress
                </text>
              </g>
            </svg>
          </div>
        </div>
      </GlassCard>

      {/* 2. Individual Spectrum */}
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
              {studentData.map(({ student, rawAnnotations, segments }, sIdx) => {
                const y = sIdx * (BAND_HEIGHT + BAND_GAP)

                return (
                  <g key={student.id} transform={`translate(0, ${y})`}>
                    <text
                      x={LABEL_WIDTH - 20}
                      y={BAND_HEIGHT / 2}
                      textAnchor="end"
                      alignmentBaseline="middle"
                      className="fill-charcoal font-bold text-sm uppercase tracking-wider font-sans"
                    >
                      {student.first_name} {student.last_name}
                    </text>

                    <rect 
                      x={LABEL_WIDTH} 
                      y={0} 
                      width={textLength} 
                      height={BAND_HEIGHT} 
                      fill="#FDFBF7"
                      className="opacity-50"
                    />

                    <g transform={`translate(${LABEL_WIDTH}, 0)`}>
                      {/* Visual layers (multiply blend) */}
                      {rawAnnotations.map((ann) => (
                        <rect
                          key={ann.id}
                          x={ann.start_offset}
                          y={0}
                          width={ann.end_offset - ann.start_offset}
                          height={BAND_HEIGHT}
                          fill={RASA_CONFIGS[ann.rasa_label].color}
                          style={{ mixBlendMode: 'multiply' }}
                          className="opacity-80 pointer-events-none"
                        />
                      ))}
                      
                      {/* Hover hitboxes */}
                      {segments.map((seg, idx) => (
                        <rect
                          key={`hover-${idx}`}
                          x={seg.start}
                          y={0}
                          width={seg.end - seg.start}
                          height={BAND_HEIGHT}
                          fill="transparent"
                          className="cursor-crosshair"
                          onMouseMove={(e) => handleMouseMove(e, {
                            studentName: `${student.first_name} ${student.last_name}`,
                            emotions: seg.emotions.map(label => ({
                              name: RASA_CONFIGS[label].name,
                              color: RASA_CONFIGS[label].color
                            })),
                            passage: text.substring(seg.start, seg.end)
                          })}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      ))}
                    </g>
                  </g>
                )
              })}

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
                  Progress
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
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em]">
                  {tooltip.content.studentName}
                </span>
                <div className="flex flex-col gap-1">
                  {tooltip.content.emotions.map((em, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm" 
                        style={{ backgroundColor: em.color }}
                      />
                      <span className="text-lg font-normal text-charcoal">
                        {em.name}
                      </span>
                      {em.agreement && (
                        <span className="glass bg-charcoal/5 px-2 py-0.5 rounded text-[9px] font-bold text-charcoal/60 uppercase ml-auto">
                          {em.agreement}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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
