import Link from 'next/link';
import { Orb } from '@/components/ui/Orb';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { InfoTabs } from '@/components/info/InfoTabs';

export default function LandingPage() {
  const mainPortalContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-3xl">
      <GlassCard className="flex flex-col items-center p-10 hover:-translate-y-1 transition-all duration-500">
        <h2 className="text-3xl text-charcoal mb-4">I&apos;m a Teacher</h2>
        <p className="text-warm-grey mb-10 text-lg leading-relaxed h-12">
          Manage classes, upload texts, and view student visualizations.
        </p>
        <Link href="/teacher/login" className="w-full">
          <PillButton className="w-full py-4 text-xl">Enter Portal</PillButton>
        </Link>
      </GlassCard>

      <GlassCard className="flex flex-col items-center p-10 hover:-translate-y-1 transition-all duration-500">
        <h2 className="text-3xl text-charcoal mb-4">I&apos;m a Student</h2>
        <p className="text-warm-grey mb-10 text-lg leading-relaxed h-12">
          Join a class, manage assignments, and track your progress.
        </p>
        <Link href="/student/login" className="w-full">
          <PillButton className="w-full py-4 text-xl">Student Portal</PillButton>
        </Link>
      </GlassCard>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col atmospheric-bg">
      <main className="flex-1 flex flex-col items-center justify-center p-6 py-20 text-center max-w-6xl mx-auto space-y-16 w-full">
        <div className="flex flex-col items-center space-y-6">
          <Orb size="lg" />
          <h1 className="text-7xl font-normal tracking-tight text-charcoal">
            Affective Landmarking
          </h1>
          <p className="text-3xl text-warm-grey font-light">
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

function PortalCard({ title, description, href, buttonText }: { title: string, description: string, href: string, buttonText: string }) {
  return (
    <GlassCard className="flex flex-col items-center p-10 hover:-translate-y-1 transition-all duration-500">
      <h2 className="text-3xl text-charcoal mb-4">{title}</h2>
      <p className="text-warm-grey mb-10 text-lg leading-relaxed h-12">
        {description}
      </p>
      <Link href={href} className="w-full">
        <PillButton className="w-full py-4 text-xl">{buttonText}</PillButton>
      </Link>
    </GlassCard>
  )
}
