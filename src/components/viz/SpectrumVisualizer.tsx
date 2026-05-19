'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { RASA_CONFIGS, RasaLabel, Annotation, Student } from '@/types/database'

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-50 animate-pulse rounded-2xl flex items-center justify-center text-gray-400">Loading Visualization...</div>
})

interface SpectrumProps {
  text: string
  annotations: Annotation[]
  students: Student[]
  title: string
}

export default function SpectrumVisualizer({ text, annotations, students, title }: SpectrumProps) {
  const textLength = text.length

  // 1. Prepare Per-Student Traces
  // We want one row (Y value) per student
  const studentMap = new Map(students.map((s, i) => [s.id, { name: s.name, index: i }]))
  
  const studentTraces = annotations.map(ann => {
    const student = studentMap.get(ann.student_id)
    if (!student) return null

    const rasa = RASA_CONFIGS[ann.rasa_label]
    const snippet = text.substring(ann.start_offset, ann.end_offset)

    return {
      x: [ann.start_offset, ann.end_offset],
      y: [student.index, student.index],
      mode: 'lines',
      line: { color: rasa.color, width: 20 },
      name: rasa.name,
      hoverinfo: 'text',
      hovertext: `<b>${student.name}</b><br>Emotion: ${rasa.name}<br>Text: "${snippet}"`,
      showlegend: false,
      type: 'scatter'
    }
  }).filter(Boolean)

  // 2. Prepare Consensus Data
  // Create a map of character positions and the count of each Rasa
  const charConsensus = Array.from({ length: textLength }, () => ({} as Record<RasaLabel, number>))
  
  annotations.forEach(ann => {
    for (let i = ann.start_offset; i < ann.end_offset; i++) {
      if (i < textLength) {
        charConsensus[i][ann.rasa_label] = (charConsensus[i][ann.rasa_label] || 0) + 1
      }
    }
  })

  // Group adjacent characters with the same consensus set to minimize Plotly shapes
  const consensusGroups: { start: number, end: number, rasas: { label: RasaLabel, count: number }[] }[] = []
  let currentGroup: { start: number, rasas: string } | null = null

  charConsensus.forEach((counts, i) => {
    const sortedRasas = (Object.entries(counts) as [RasaLabel, number][])
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
    
    const rasaKey = sortedRasas.map(r => `${r[0]}:${r[1]}`).join(',')

    if (!currentGroup || currentGroup.rasas !== rasaKey) {
      if (currentGroup) {
        consensusGroups[consensusGroups.length - 1].end = i
      }
      consensusGroups.push({ 
        start: i, 
        end: i + 1, 
        rasas: sortedRasas.map(([label, count]) => ({ label, count }))
      })
      currentGroup = { start: i, rasas: rasaKey }
    } else {
      consensusGroups[consensusGroups.length - 1].end = i + 1
    }
  })

  // Create Consensus Shapes (Vertical stacking for ties)
  const consensusShapes: any[] = []
  const totalStudents = students.length || 1

  consensusGroups.forEach(group => {
    if (group.rasas.length === 0) return

    let currentY = 0
    group.rasas.forEach(rasa => {
      const height = rasa.count / totalStudents
      consensusShapes.push({
        type: 'rect',
        x0: group.start,
        x1: group.end,
        y0: currentY,
        y1: currentY + height,
        fillcolor: RASA_CONFIGS[rasa.label].color,
        line: { width: 0 },
        xref: 'x',
        yref: 'y2'
      })
      currentY += height
    })
  })

  return (
    <div className="space-y-12">
      {/* Individual Student Spectrum */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center justify-between">
          Student Spectrum
          <span className="text-xs font-normal text-gray-400">One row per student</span>
        </h3>
        <div className="w-full overflow-hidden">
          <Plot
            data={studentTraces as any}
            layout={{
              title: '',
              height: Math.max(200, students.length * 40),
              margin: { l: 120, r: 40, t: 20, b: 40 },
              xaxis: { 
                title: 'Text Position (Characters)',
                range: [0, textLength],
                gridcolor: '#f3f4f6'
              },
              yaxis: {
                tickmode: 'array',
                tickvals: students.map((_, i) => i),
                ticktext: students.map(s => s.name),
                gridcolor: '#f3f4f6',
                fixedrange: true
              },
              hovermode: 'closest',
              plot_bgcolor: 'white',
              paper_bgcolor: 'white',
            }}
            config={{ responsive: true, displayModeBar: false }}
            className="w-full"
          />
        </div>
      </div>

      {/* Consensus Spectrum */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center justify-between">
          Consensus Spectrum
          <span className="text-xs font-normal text-gray-400">Aggregated Class View</span>
        </h3>
        <p className="text-sm text-gray-500 mb-6 italic">
          Vertical height/stacking represents the proportion of students who chose each emotion.
        </p>
        <div className="w-full overflow-hidden">
          <Plot
            data={[{
              x: [0, textLength],
              y: [0, 1],
              type: 'scatter',
              mode: 'markers',
              marker: { opacity: 0 },
              showlegend: false,
              hoverinfo: 'none'
            }]}
            layout={{
              title: '',
              height: 150,
              margin: { l: 40, r: 40, t: 10, b: 40 },
              xaxis: { 
                range: [0, textLength],
                title: 'Text Position',
                gridcolor: '#f3f4f6'
              },
              yaxis: { 
                range: [0, 1],
                visible: false,
                fixedrange: true
              },
              shapes: consensusShapes as any,
              plot_bgcolor: 'white',
              paper_bgcolor: 'white',
            }}
            config={{ responsive: true, displayModeBar: false }}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
