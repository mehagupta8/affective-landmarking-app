import Link from 'next/link';
import { Orb } from '@/components/ui/Orb';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { InfoTabs } from '@/components/info/InfoTabs';

export default function LandingPage() {
  const mainPortalContent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
      <GlassCard className="flex flex-col items-center p-6 md:p-8 hover:-translate-y-1 transition-all duration-500">
        <h2 className="text-2xl md:text-3xl text-charcoal mb-3 md:mb-4">I&apos;m a Teacher</h2>
        <p className="text-warm-grey mb-6 md:mb-8 text-base leading-relaxed flex-1">
          Manage classes, upload texts, and view student visualizations.
        </p>
        <Link href="/teacher/login" className="w-full">
          <PillButton className="w-full py-3 text-lg">Enter Portal</PillButton>
        </Link>
      </GlassCard>

      <GlassCard className="flex flex-col items-center p-6 md:p-8 hover:-translate-y-1 transition-all duration-500">
        <h2 className="text-2xl md:text-3xl text-charcoal mb-3 md:mb-4">I&apos;m a Student</h2>
        <p className="text-warm-grey mb-6 md:mb-8 text-base leading-relaxed flex-1">
          Join a class, manage assignments, and track your progress.
        </p>
        <Link href="/student/login" className="w-full">
          <PillButton className="w-full py-3 text-lg">Student Portal</PillButton>
        </Link>
      </GlassCard>

      <GlassCard className="flex flex-col items-center p-6 md:p-8 hover:-translate-y-1 transition-all duration-500 border-dashed border-white/30 bg-white/20">
        <h2 className="text-2xl md:text-3xl text-charcoal mb-3 md:mb-4">Join as Guest</h2>
        <p className="text-warm-grey mb-6 md:mb-8 text-base leading-relaxed flex-1">
          No account needed. Enter a class code and start annotating instantly.
        </p>
        <Link href="/join" className="w-full">
          <PillButton className="w-full py-3 text-lg bg-white/40 text-charcoal border border-charcoal/10 shadow-sm hover:bg-white/60">
            Enter as Guest
          </PillButton>
        </Link>
      </GlassCard>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col atmospheric-bg">
      <main className="flex-1 flex flex-col items-center justify-center p-6 py-12 md:py-20 text-center max-w-6xl mx-auto space-y-10 md:space-y-16 w-full">
        <div className="flex flex-col items-center space-y-4 md:space-y-6">
          <Orb size="lg" />
          <h1 className="text-4xl md:text-7xl font-normal tracking-tight text-charcoal">
            Affective Landmarking
          </h1>
          <p className="text-xl md:text-3xl text-warm-grey font-light">
            A space to feel literature, slowly.
          </p>
        </div>

        <InfoTabs mainContent={mainPortalContent} />
      </main>

      <footer className="p-6 md:p-12 text-center text-warm-grey/40 text-sm tracking-widest">
        © {new Date().getFullYear()} AFFECTIVE LANDMARKING
      </footer>
    </div>
  );
}

