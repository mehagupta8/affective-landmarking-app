import React from 'react'

export function AboutContent() {
  return (
    <div className="space-y-12 text-left max-w-4xl mx-auto">
      <section className="space-y-6">
        <h2 className="text-3xl font-normal text-charcoal">What this app does</h2>
        <p className="text-lg text-charcoal/80 leading-relaxed font-light">
          Affective Landmarking lets readers annotate texts line-by-line with color-coded emotional labels (drawn from the eight emotions of classical Indian aesthetics: fear, joy, anger, wonder, disgust, love, heroism, sadness) as they read. Once finished, the app turns those annotations into a visual color spectrum, a map of how emotions shift, cluster, and overlap across a text. Instead of summarizing &quot;what a text means&quot; after the fact, it captures the live, in-the-moment experience of reading.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-normal text-charcoal">Who it&apos;s for</h2>
        <p className="text-lg text-charcoal/80 leading-relaxed font-light">
          Students, teachers, and researchers in literature and writing classrooms, anyone curious about how readers actually feel while reading, especially texts often labeled &quot;controversial,&quot; &quot;offensive,&quot; or &quot;difficult.&quot; It works for individual close reading or as a classroom activity followed by group discussion.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-normal text-charcoal">Background</h2>
        <div className="space-y-6 text-lg text-charcoal/80 leading-relaxed font-light">
          <p>
            This project began when Mahasweta Devi&apos;s short story &quot;Draupadi&quot; was removed from Delhi University&apos;s standardized curriculum after being deemed &quot;offensive.&quot; That decision was made without any input from the students actually reading the text. I wanted to find a way to capture how students respond to texts like this, beyond a single label like &quot;offensive.&quot;
          </p>
          <p>
            The method draws on affect theory&apos;s idea that emotion isn&apos;t just private interior feeling, but something that circulates between bodies, texts, and readers, shaping shared perceptions of a text. By combining this with Rosenblatt&apos;s transactional theory of reading (the idea that meaning happens <em>during</em> the reading event, not after) and the Rasa Theory&apos;s framework of permanent emotions, Affective Landmarking tries to capture that live transaction as it happens, rather than relying on after-the-fact interpretations or exam-style responses.
          </p>
          <p>
            I first piloted Affective Landmarking with five Indian undergraduate students annotating four texts from India&apos;s standardized syllabus, including &quot;Draupadi,&quot; using the tool Doccano. The results showed that &quot;offense&quot; was just one thread in a much wider, more varied range of emotional responses, and that a standardized national curriculum often leaves little room for these kinds of localized, embodied reading experiences.
          </p>
          <p>
            From there, the exigence shifted. The original question was about curriculum and &quot;offense&quot; in the Indian context, but adapting the method for a U.S. classroom raised a different question: could this same affective approach work across cultures, disciplines, and student populations? Working with first-year writing students at Queens College on Claudia Rankine&apos;s <em>Citizen: An American Lyric</em>, the focus moved from curriculum politics toward questions of audience, identity, and address, especially the poem&apos;s use of &quot;you.&quot; This showed that Affective Landmarking isn&apos;t tied to one curriculum or one country&apos;s politics; it&apos;s a portable method for making the emotional work of reading visible, wherever that reading happens.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-normal text-charcoal">Further reading</h2>
        <ul className="list-disc list-outside ml-6 space-y-3 text-base text-charcoal/70 font-light">
          <li>Gupta, Meha. &quot;Feeling The Reading: Affective Landmarking and Literary Studies in India.&quot; <em>Journal of Interactive Technology and Pedagogy</em>, Issue 26, 2025.</li>
          <li>Gupta, Meha. <em>mehagupta8/Affective-Landmarking</em>. Zenodo, 2025.</li>
          <li>Rankine, Claudia. <em>Citizen: An American Lyric</em>. Graywolf Press, 2014.</li>
          <li>Devi, Mahasweta. &quot;Draupadi&quot; (1978).</li>
          <li>Rosenblatt, Louise. <em>The Reader, the Text, the Poem</em>. Southern Illinois UP, 1978.</li>
          <li>Ahmed, Sara. <em>The Cultural Politics of Emotion</em>. Edinburgh UP, 2014.</li>
        </ul>
      </section>
    </div>
  )
}
