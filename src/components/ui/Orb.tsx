import { cn } from "@/lib/utils";

interface OrbProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

export function Orb({ size = "md", className, animate = true }: OrbProps) {
  const sizes = {
    xs: "w-2 h-2",
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-16 h-16",
    xl: "w-32 h-32",
  };

  return (
    <div
      className={cn(
        "rounded-full blur-[2px]",
        sizes[size],
        animate && "animate-breathe",
        className
      )}
      style={{
        background: "radial-gradient(circle, #E89B6C 0%, rgba(232, 155, 108, 0) 70%)",
      }}
    />
  );
}
