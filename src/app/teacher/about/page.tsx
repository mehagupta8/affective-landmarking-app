import { AboutContent } from "@/components/info/AboutContent";
import { GlassCard } from "@/components/ui/GlassCard";

export default function TeacherAboutPage() {
  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="space-y-3 text-center">
        <h1 className="text-5xl font-normal text-charcoal">About the Project</h1>
        <p className="text-warm-grey text-xl font-light">Capturing the live transaction of reading.</p>
      </div>

      <GlassCard className="p-12 md:p-20 shadow-xl border-white/60">
        <AboutContent />
      </GlassCard>
    </div>
  )
}
