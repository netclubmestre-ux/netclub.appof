import { cn } from "@/lib/utils";

export function Tag({
  children,
  active,
  onClick,
  title,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  className?: string;
}) {
  const base =
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors";
  if (!onClick) {
    return (
      <span
        title={title}
        className={cn(base, "border-border bg-surface-2 text-muted-foreground", className)}
      >
        {children}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        base,
        active
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-border bg-surface-2 text-muted-foreground hover:border-primary/40 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
