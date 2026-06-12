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
        <path
          d="M0 20C20 10 30 30 50 20C70 10 80 30 100 20"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-terracotta opacity-80"
        />
        <path
          d="M0 30C20 20 30 40 50 30C70 20 80 40 100 30"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-terracotta/40"
        />
      </svg>
    </div>
  );
}
