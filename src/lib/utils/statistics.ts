import { Annotation, RasaLabel, RASA_CONFIGS } from '@/types/database'

export interface EmotionCoverage {
  label: RasaLabel
  name: string
  color: string
  textCoverage: number // % of text covered by this emotion
  totalAffectShare: number // % of total highlights that are this emotion
  uniqueCharacterCount: number
}

export interface PositionalSpike {
  binIndex: number
  emotions: RasaLabel[]
  intensity: number // coverage in this bin vs average
}

export interface CoOccurrence {
  emotionA: RasaLabel
  emotionB: RasaLabel
  overlapCharacters: number
  overlapPercentage: number // % of A that overlaps with B
}

export interface ContestedSegment {
  start: number
  end: number
  diversityIndex: number
  labels: { label: RasaLabel, count: number }[]
}

export class AffectiveStats {
  private textLength: number
  private annotations: Annotation[]
  private studentCount: number

  constructor(textLength: number, annotations: Annotation[], studentCount: number = 1) {
    this.textLength = textLength
    this.annotations = annotations
    this.studentCount = studentCount || 1
  }

  // 1. Emotion Distribution
  getDistribution(): EmotionCoverage[] {
    if (this.textLength === 0) return []

    const emotionStats: Record<string, number> = {}
    let totalUniqueCoverageAcrossAll = 0

    const labels = Object.keys(RASA_CONFIGS) as RasaLabel[]
    
    const results = labels.map(label => {
      const labelAnns = this.annotations.filter(a => a.rasa_label === label)
      const merged = this.mergeIntervals(labelAnns.map(a => [a.start_offset, a.end_offset]))
      const uniqueCount = merged.reduce((acc, [s, e]) => acc + (e - s), 0)
      
      totalUniqueCoverageAcrossAll += uniqueCount
      
      return {
        label,
        name: RASA_CONFIGS[label].name,
        color: RASA_CONFIGS[label].color,
        uniqueCharacterCount: uniqueCount,
        textCoverage: (uniqueCount / this.textLength) * 100,
        totalAffectShare: 0 // Will calculate in second pass
      }
    })

    return results.map(r => ({
      ...r,
      totalAffectShare: totalUniqueCoverageAcrossAll > 0 ? (r.uniqueCharacterCount / totalUniqueCoverageAcrossAll) * 100 : 0
    }))
  }

  // 2. Positional Clustering (Deciles)
  getPositionalSpikes(binCount: number = 10): PositionalSpike[] {
    if (this.textLength === 0) return []
    const binSize = this.textLength / binCount
    const labels = Object.keys(RASA_CONFIGS) as RasaLabel[]
    
    // Calculate global averages per label
    const distribution = this.getDistribution()
    const globalAverages = Object.fromEntries(distribution.map(d => [d.label, d.uniqueCharacterCount / binCount]))

    const spikes: PositionalSpike[] = []

    for (let i = 0; i < binCount; i++) {
      const binStart = i * binSize
      const binEnd = (i + 1) * binSize
      const binEmotions: RasaLabel[] = []
      let maxIntensity = 0

      labels.forEach(label => {
        const labelAnns = this.annotations.filter(a => a.rasa_label === label)
        const binCoverage = this.calculateIntersectionWithRange(labelAnns, binStart, binEnd)
        const avg = globalAverages[label]
        
        // Spike detection: > 2x average
        if (avg > 0 && binCoverage > avg * 2) {
          binEmotions.push(label)
          maxIntensity = Math.max(maxIntensity, binCoverage / avg)
        }
      })

      if (binEmotions.length > 0) {
        spikes.push({ binIndex: i, emotions: binEmotions, intensity: maxIntensity })
      }
    }

    return spikes
  }

  // 3. Co-occurrence Matrix (Top 5)
  getTopCoOccurrences(): CoOccurrence[] {
    const labels = Object.keys(RASA_CONFIGS) as RasaLabel[]
    const results: CoOccurrence[] = []

    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const labelA = labels[i]
        const labelB = labels[j]
        
        const annsA = this.annotations.filter(a => a.rasa_label === labelA)
        const annsB = this.annotations.filter(a => a.rasa_label === labelB)
        
        const overlap = this.calculateInterLabelOverlap(annsA, annsB)
        
        if (overlap > 0) {
          const coverageA = this.getDistribution().find(d => d.label === labelA)?.uniqueCharacterCount || 1
          results.push({
            emotionA: labelA,
            emotionB: labelB,
            overlapCharacters: overlap,
            overlapPercentage: (overlap / coverageA) * 100
          })
        }
      }
    }

    return results.sort((a, b) => b.overlapCharacters - a.overlapCharacters).slice(0, 5)
  }

  // 4. Coverage & Gaps
  getCoverageMetrics() {
    const merged = this.mergeIntervals(this.annotations.map(a => [a.start_offset, a.end_offset]))
    const coveredChars = merged.reduce((acc, [s, e]) => acc + (e - s), 0)
    
    const gaps: { start: number, end: number, length: number }[] = []
    for (let i = 0; i < merged.length - 1; i++) {
      const start = merged[i][1]
      const end = merged[i+1][0]
      if (end - start > 0) {
        gaps.push({ start, end, length: end - start })
      }
    }

    return {
      percentage: (coveredChars / this.textLength) * 100,
      totalGaps: gaps.length,
      largestGaps: gaps.sort((a, b) => b.length - a.length).slice(0, 3)
    }
  }

  // 5. Class Contestedness
  getContestedSegments(): ContestedSegment[] {
    if (this.studentCount <= 1 || this.annotations.length === 0) return []

    // Segment the text by all annotation change points
    const points = new Set<number>([0, this.textLength])
    this.annotations.forEach(a => {
      points.add(a.start_offset)
      points.add(a.end_offset)
    })
    const sortedPoints = Array.from(points).sort((a, b) => a - b)

    const segments: ContestedSegment[] = []

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const start = sortedPoints[i]
      const end = sortedPoints[i + 1]
      
      const segmentAnns = this.annotations.filter(a => a.start_offset <= start && a.end_offset >= end)
      if (segmentAnns.length === 0) continue

      const labelCounts: Record<string, number> = {}
      segmentAnns.forEach(a => {
        labelCounts[a.rasa_label] = (labelCounts[a.rasa_label] || 0) + 1
      })

      // Simpson's Diversity Index
      const n_counts = Object.values(labelCounts)
      const N = segmentAnns.length
      let diversity = 0
      if (N > 1) {
        const sum_n = n_counts.reduce((acc, n) => acc + n * (n - 1), 0)
        diversity = 1 - (sum_n / (N * (N - 1)))
      }

      if (diversity > 0.3) { // Threshold for "contested"
        segments.push({
          start,
          end,
          diversityIndex: diversity,
          labels: Object.entries(labelCounts).map(([l, c]) => ({ label: l as RasaLabel, count: c }))
        })
      }
    }

    return segments.sort((a, b) => b.diversityIndex - a.diversityIndex).slice(0, 5)
  }

  // Helpers
  private mergeIntervals(intervals: [number, number][]): [number, number][] {
    if (intervals.length === 0) return []
    const sorted = [...intervals].sort((a, b) => a[0] - b[0])
    const merged: [number, number][] = [[...sorted[0]] as [number, number]]
    
    for (let i = 1; i < sorted.length; i++) {
      const last = merged[merged.length - 1]
      const curr = sorted[i]
      if (curr[0] <= last[1]) {
        last[1] = Math.max(last[1], curr[1])
      } else {
        merged.push([...curr] as [number, number])
      }
    }
    return merged
  }

  private calculateIntersectionWithRange(anns: Annotation[], rangeStart: number, rangeEnd: number): number {
    const intervals = anns.map(a => [
      Math.max(a.start_offset, rangeStart),
      Math.min(a.end_offset, rangeEnd)
    ]).filter(([s, e]) => e > s) as [number, number][]
    
    const merged = this.mergeIntervals(intervals)
    return merged.reduce((acc, [s, e]) => acc + (e - s), 0)
  }

  private calculateInterLabelOverlap(annsA: Annotation[], annsB: Annotation[]): number {
    const mergedA = this.mergeIntervals(annsA.map(a => [a.start_offset, a.end_offset]))
    const mergedB = this.mergeIntervals(annsB.map(a => [a.start_offset, a.end_offset]))
    
    let totalOverlap = 0
    mergedA.forEach(([sA, eA]) => {
      mergedB.forEach(([sB, eB]) => {
        const overlap = Math.min(eA, eB) - Math.max(sA, sB)
        if (overlap > 0) totalOverlap += overlap
      })
    })
    return totalOverlap
  }
}
