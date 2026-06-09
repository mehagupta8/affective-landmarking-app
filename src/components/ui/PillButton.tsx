import { cn } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes } from "react";

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export function PillButton({ children, className, ...props }: PillButtonProps) {
  return (
    <button
      className={cn(
        "rounded-full bg-charcoal text-[#F4E4DC] px-8 py-3 tracking-wider hover:scale-105 active:scale-95 transition-all shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
