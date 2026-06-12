import React from 'react'
import { BookOpen, UserPlus, Fingerprint, Palette, BarChart2, PenTool } from 'lucide-react'

export function HowToUseContent() {
  const steps = [
    {
      title: "Join or Create",
      description: "Teachers create a class and upload texts. Students join using a unique 6-digit class code.",
      icon: UserPlus
    },
    {
      title: "Secure Your Identity",
      description: "Both teachers and students create a 4-digit PIN. This ensures your annotations and dashboard remain private.",
      icon: Fingerprint
    },
    {
      title: "Read & Annotate",
      description: "Select a text from the library. As you read, highlight phrases and select one of the eight Rasas (emotions) that match your feeling in that moment.",
      icon: BookOpen
    },
    {
      title: "Layer Emotions",
      description: "Literature is complex. You can layer multiple emotions on the same line to create blended colors.",
      icon: Palette
    },
    {
      title: "Finalize & Unlock",
      description: "Once you've annotated the entire text, hit 'Submit.' This unlocks the Class Consolidated Spectrum, where you can see how your journey compares to your peers.",
      icon: BarChart2
    },
    {
      title: "Writing Activity",
      description: "After viewing the spectrum, your teacher may assign a writing activity. You will pick one emotion from your landmarking (or use the random selector) to produce a close reading paragraph based on that specific affective lens.",
      icon: PenTool
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.map((step, idx) => (
          <div key={idx} className="flex gap-6 p-8 bg-white/20 rounded-[32px] border border-white/40 shadow-sm hover:bg-white/30 transition-all group">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/60 flex items-center justify-center text-terracotta group-hover:scale-110 transition-transform shadow-sm">
              <step.icon className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black text-terracotta/40 uppercase tracking-[0.2em]">Step 0{idx + 1}</span>
              <h3 className="text-xl font-normal text-charcoal">{step.title}</h3>
              <p className="text-sm text-charcoal/70 leading-relaxed font-light">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-terracotta/5 border border-terracotta/10 p-10 rounded-[40px] text-center space-y-4">
        <h3 className="text-2xl text-charcoal font-light">Ready to start?</h3>
        <p className="text-warm-grey font-light italic">
          &quot;The reader brings to the text his past experience and present personality.&quot; — Louise Rosenblatt
        </p>
      </div>
    </div>
  )
}
