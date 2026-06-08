import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "new" | "sale" | "featured" | "muted" | "success" | "danger";
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-bg-elevated text-ink-muted border border-border-default",
    new: "bg-accent/20 text-accent-light border border-accent/30",
    sale: "bg-gold/20 text-gold border border-gold/30",
    featured: "bg-gold-muted text-gold-light border border-gold/20",
    muted: "bg-bg-elevated text-ink-dim",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    danger: "bg-red-500/15 text-red-400 border border-red-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
