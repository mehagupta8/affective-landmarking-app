import Link from 'next/link';
import { Orb } from '@/components/ui/Orb';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { InfoTabs } from '@/components/info/InfoTabs';

export default function LandingPage() {
  const mainPortalContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-3xl">
      <GlassCard className="flex flex-col items-center p-10 hover:-translate-y-1 transition-all duration-500">
        <h2 className="text-2xl text-charcoal mb-4">I&apos;m a Teacher</h2>
        <p className="text-warm-grey mb-10 text-base leading-relaxed h-12">
          Manage classes, upload texts, and view student visualizations.
        </p>
        <Link href="/teacher/login" className="w-full">
          <PillButton className="w-full py-4">Enter Portal</PillButton>
        </Link>
      </GlassCard>

      <GlassCard className="flex flex-col items-center p-10 hover:-translate-y-1 transition-all duration-500">
        <h2 className="text-2xl text-charcoal mb-4">I&apos;m a Student</h2>
        <p className="text-warm-grey mb-10 text-base leading-relaxed h-12">
          Join a class, manage assignments, and track your progress.
        </p>
        <Link href="/student/dashboard" className="w-full">
          <PillButton className="w-full py-4">Student Portal</PillButton>
        </Link>
      </GlassCard>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col atmospheric-bg">
      <main className="flex-1 flex flex-col items-center justify-center p-6 py-20 text-center max-w-6xl mx-auto space-y-16 w-full">
        <div className="flex flex-col items-center space-y-6">
          <Orb size="lg" className="shadow-[0_0_40px_rgba(232,155,108,0.4)]" />
          <h1 className="text-6xl font-normal tracking-tight text-charcoal">
            Affective Landmarking
          </h1>
          <p className="text-2xl text-warm-grey font-light">
            A space to feel literature, slowly.
          </p>
        </div>

        <InfoTabs mainContent={mainPortalContent} />
      </main>

      <footer className="p-12 text-center text-warm-grey/40 text-sm tracking-widest">
        © {new Date().getFullYear()} AFFECTIVE LANDMARKING
      </footer>
    </div>
  );
}
