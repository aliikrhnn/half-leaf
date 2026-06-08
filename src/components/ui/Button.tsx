import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none rounded-lg";

    const variants = {
      primary:
        "bg-accent text-ink hover:bg-accent-light active:scale-[0.98] shadow-lg shadow-accent/20",
      secondary:
        "bg-bg-elevated text-ink border border-border-default hover:border-border-light hover:bg-bg-card active:scale-[0.98]",
      ghost:
        "text-ink-muted hover:text-ink hover:bg-bg-elevated active:scale-[0.98]",
      gold: "bg-gold text-bg font-semibold hover:bg-gold-light active:scale-[0.98] shadow-lg shadow-gold/20",
      danger:
        "bg-red-900/50 text-red-300 border border-red-900 hover:bg-red-900/70 active:scale-[0.98]",
    };

    const sizes = {
      sm: "text-sm px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2.5 gap-2",
      lg: "text-base px-6 py-3 gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
