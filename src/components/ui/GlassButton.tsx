import { cn } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes } from "react";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export function GlassButton({ children, className, ...props }: GlassButtonProps) {
  return (
    <button
      className={cn(
        "glass rounded-full px-8 py-3 text-charcoal hover:bg-white/80 hover:scale-105 active:scale-95 transition-all",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
