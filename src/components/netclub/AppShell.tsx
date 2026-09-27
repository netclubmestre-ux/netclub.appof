import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Home, MessageCircle, Users, LayoutGrid, User } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/network", label: "Network", icon: Users },
  { to: "/clubs", label: "Clubs", icon: LayoutGrid },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`text-xl font-extrabold tracking-tight ${className}`}>
      Net<span className="text-primary">Club</span>
      <span className="text-gold">.</span>
    </span>
  );
}

function isActive(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

export function TopBar({
  title,
  back,
}: {
  title?: string;
  back?: { to: string; label?: string };
}) {
  return (
    <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 bg-background/85 px-5 py-3.5 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        {back ? (
          <Link
            to={back.to}
            className="-ml-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Voltar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : null}
        {title ? (
          <h1 className="truncate text-lg font-bold tracking-tight">{title}</h1>
        ) : (
          <Wordmark />
        )}
      </div>
      <Link
        to="/notifications"
        aria-label="Notificações"
        className="relative shrink-0 rounded-full p-2 text-foreground transition-colors hover:bg-secondary"
      >
        <Bell className="h-[22px] w-[22px]" strokeWidth={1.8} />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold" />
      </Link>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background lg:flex lg:justify-center lg:gap-8 lg:px-8">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-1 border-r border-border/60 py-8 pr-6 lg:flex">
        <Wordmark className="mb-8 px-3 text-2xl" />
        {nav.map((item) => {
          const active = isActive(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" strokeWidth={1.9} />
              {item.label}
            </Link>
          );
        })}
      </aside>

      <main className="w-full pb-24 lg:max-w-2xl lg:pb-12">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-xl lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {nav.map((item) => {
            const active = isActive(pathname, item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {active ? (
                    <span className="absolute -top-px h-0.5 w-8 rounded-full bg-primary" />
                  ) : null}
                  <item.icon
                    className="h-[22px] w-[22px]"
                    strokeWidth={active ? 2.2 : 1.7}
                    fill={active ? "currentColor" : "none"}
                    fillOpacity={active ? 0.16 : 0}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}

export function SearchBar({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-border bg-surface px-4 py-3 transition-colors focus-within:border-primary/50">
      <svg className="h-4 w-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.2-3.2" strokeLinecap="round" />
      </svg>
      <input
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        placeholder={placeholder}
      />
    </div>
  );
}

export function SectionHeader({
  title,
  action,
  to,
}: {
  title: string;
  action?: string;
  to?: string;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3">
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      {action && to ? (
        <Link to={to} className="text-sm font-semibold text-primary hover:underline">
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export function AvatarStack({ imgs, extra }: { imgs: string[]; extra?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {imgs.map((src) => (
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            className="h-6 w-6 rounded-full border border-background object-cover"
          />
        ))}
      </div>
      {extra ? <span className="text-xs text-muted-foreground">+{extra}</span> : null}
    </div>
  );
}
