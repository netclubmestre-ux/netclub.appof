import logoUrl from "@/assets/netclub-wordmark.png";

export function Logo({ className = "h-7" }: { className?: string }) {
  return (
    <img
      src={logoUrl}
      alt="NetClub"
      draggable={false}
      className={`w-auto shrink-0 select-none ${className}`}
    />
  );
}
