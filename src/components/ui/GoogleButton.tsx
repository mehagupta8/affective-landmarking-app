import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface GoogleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  label?: string;
}

export function GoogleButton({ className, label = "Continue with Google", ...props }: GoogleButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-center gap-3 w-full rounded-full bg-white border border-charcoal/10 text-charcoal px-8 py-3 font-medium hover:bg-white/80 hover:scale-[1.02] active:scale-95 transition-all shadow-sm",
        className
      )}
      {...props}
    >
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
          fill="#4285F4"
        />
        <path
          d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
          fill="#34A853"
        />
        <path
          d="M3.964 10.707a5.41 5.41 0 01-.282-1.707c0-.594.102-1.174.282-1.707V4.961H.957a8.996 8.996 0 000 8.078l3.007-2.332z"
          fill="#FBBC05"
        />
        <path
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.582C13.463.891 11.426 0 9 0 5.482 0 2.399 2.021.957 4.961L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
          fill="#EA4335"
        />
      </svg>
      {label}
    </button>
  );
}
