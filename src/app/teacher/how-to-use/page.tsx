import { HowToUseContent } from "@/components/info/HowToUseContent";

export default function TeacherHowToUsePage() {
  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="space-y-3 text-center">
        <h1 className="text-5xl font-normal text-charcoal">How to Use</h1>
        <p className="text-warm-grey text-xl font-light">Guide to emotional landmarking in your classroom.</p>
      </div>

      <div className="py-10">
        <HowToUseContent />
      </div>
    </div>
  )
}
