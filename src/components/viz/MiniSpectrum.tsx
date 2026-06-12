'use client'

import React from 'react'
import { RASA_CONFIGS, Annotation } from '@/types/database'

interface MiniSpectrumProps {
  textLength: number
  annotations: Annotation[]
  height?: number
  className?: string
}

export function MiniSpectrum({ textLength, annotations, height = 24, className }: MiniSpectrumProps) {
  if (textLength === 0) return null

  return (
    <div className={className}>
      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 ${textLength} ${height}`}
        preserveAspectRatio="none"
        className="rounded-md overflow-hidden"
      >
        {/* Background layer */}
        <rect width={textLength} height={height} fill="#FDFBF7" opacity={0.5} />
        
        {/* Annotation layers */}
        {annotations.map((ann) => (
          <rect
            key={ann.id}
            x={ann.start_offset}
            y={0}
            width={ann.end_offset - ann.start_offset}
            height={height}
            fill={RASA_CONFIGS[ann.rasa_label].color}
            style={{ mixBlendMode: 'multiply' }}
            className="opacity-80"
          />
        ))}
      </svg>
    </div>
  )
}
