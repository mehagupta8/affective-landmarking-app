import { cn } from "@/lib/utils";

interface OrbProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

export function Orb({ size = "md", className, animate = true }: OrbProps) {
  const sizes = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <div className={cn("relative flex items-center justify-center", sizes[size], className)}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("w-full h-full", animate && "animate-breathe")}
      >
        {/* Affective Barcode Mark - 4 Irregular Lines */}
        {/* 1. Red (Anger) - Thin/Medium */}
        <rect x="8" y="10" width="2" height="20" fill="#E14747" rx="1" />
        
        {/* 2. Blue (Love) - Wide/Tall */}
        <rect x="14" y="5" width="4" height="30" fill="#368BE1" rx="2" />
        
        {/* 3. Yellow (Wonder) - Thin/Medium */}
        <rect x="22" y="12" width="1.5" height="16" fill="#F8E042" rx="0.75" />
        
        {/* 4. Grey (Sadness) - Medium/Tall */}
        <rect x="28" y="8" width="3" height="24" fill="#DDDDDD" rx="1.5" />
      </svg>
    </div>
  );
}
