import { cn } from "@/lib/utils";

interface OrbProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

export function Orb({ size = "md", className, animate = true }: OrbProps) {
  const sizes = {
    xs: "w-4 h-2",
    sm: "w-8 h-4",
    md: "w-12 h-6",
    lg: "w-24 h-12",
    xl: "w-48 h-24",
  };

  return (
    <div className={cn("relative flex items-center justify-center", sizes[size], className)}>
      <svg
        viewBox="0 0 100 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("w-full h-full", animate && "animate-breathe")}
      >
        {/* Top Irregular Wave - High and Low Amplitudes */}
        <path
          d="M0 25C15 5 25 35 40 15C55 -5 70 30 85 10C95 0 100 20 100 20"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="text-terracotta opacity-90"
        />
        
        {/* Bottom Similar but Not Equal Wave */}
        <path
          d="M0 35C10 20 20 45 35 25C50 5 65 40 80 20C90 10 100 30 100 30"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="text-terracotta/40"
        />
      </svg>
    </div>
  );
}
