import React from 'react'

export function HowToUseContent() {
  const steps = [
    {
      title: "Join or Create",
      description: "Teachers create a class and upload texts. Students join using a unique 6-digit class code."
    },
    {
      title: "Secure Your Identity",
      description: "Both teachers and students create a 4-digit PIN. This ensures your annotations and dashboard remain private."
    },
    {
      title: "Assign & Read",
      description: "Teachers assign specific literary pieces to the class library. Students select an assignment to begin their reading journey."
    },
    {
      title: "Annotate with Affect",
      description: "Use color highlights to annotate the text as you read. Simply select a phrase to reveal the emotional palette and landmark your feelings."
    },
    {
      title: "Layer Emotions",
      description: "Literature is complex. You can layer multiple emotions on the same line to create blended colors and represent nuanced reactions."
    },
    {
      title: "View Class Insights",
      description: "After submitting your landmark, explore the consolidated class spectrum and analytics. Identify emotional spikes and contested passages."
    },
    {
      title: "Writing Activity",
      description: "Produce a close reading paragraph through the lens of a specific emotion you felt, or let the app challenge you with a random affect."
    }
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-24 py-10">
      <div className="space-y-20">
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col md:flex-row gap-8 md:gap-16 items-start group">
            <div className="text-7xl md:text-8xl font-normal text-charcoal/10 tracking-tighter leading-none select-none">
              {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
            </div>
            <div className="space-y-4 pt-2">
              <h3 className="text-3xl text-charcoal font-normal tracking-tight group-hover:text-accent-blue transition-colors duration-500">
                {step.title}
              </h3>
              <p className="text-xl text-charcoal/70 leading-relaxed font-light max-w-xl">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-24 border-t border-charcoal/5 text-center space-y-6">
        <p className="text-2xl text-warm-grey font-light italic max-w-2xl mx-auto leading-relaxed">
          &quot;The reader brings to the text his past experience and present personality.&quot;
        </p>
        <div className="flex flex-col items-center space-y-1">
          <span className="text-[10px] font-black text-charcoal uppercase tracking-[0.3em]">Louise Rosenblatt</span>
          <span className="text-[9px] text-warm-grey/40 uppercase tracking-[0.1em]">The Reader, the Text, the Poem</span>
        </div>
      </div>
    </div>
  )
}
