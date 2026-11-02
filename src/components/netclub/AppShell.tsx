import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Crown,
  Handshake,
  Home,
  LayoutGrid,
  LineChart,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  User,
  Users,
  Info,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { useDataMode, useRepository } from "@/data/provider";
import { meQuery, notificationsQuery } from "@/data/queries";
import { Logo } from "./Logo";
import { UserAvatar } from "./UserAvatar";
import { LanguageSelect } from "./LanguageSelect";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n";

const NAV: { to: string; labelKey: TranslationKey; icon: typeof Home }[] = [
  { to: "/home", labelKey: "nav.home", icon: Home },
  { to: "/network", labelKey: "nav.network", icon: Users },
  { to: "/netmach", labelKey: "nav.netmach", icon: Handshake },
  { to: "/clubs", labelKey: "nav.clubs", icon: LayoutGrid },
  { to: "/chat", labelKey: "nav.chat", icon: MessageCircle },
  { to: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { to: "/official", labelKey: "nav.official", icon: LineChart },
  { to: "/premium", labelKey: "nav.premium", icon: Crown },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
  { to: "/profile", labelKey: "nav.profile", icon: User },
];

const MOBILE_NAV: { to: string; labelKey: TranslationKey; icon: typeof Home }[] = [
  { to: "/home", labelKey: "nav.home", icon: Home },
  { to: "/netmach", labelKey: "nav.netmach", icon: Handshake },
  { to: "/clubs", labelKey: "nav.clubs", icon: LayoutGrid },
  { to: "/chat", labelKey: "nav.chat", icon: MessageCircle },
  { to: "/profile", labelKey: "nav.profile", icon: User },
];

export function AppShell() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const repository = useRepository();
  const { isDemo } = useDataMode();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useQuery(meQuery);
  const { data: notifications = [] } = useQuery(notificationsQuery);
  const unread = notifications.filter((n) => !n.read).length;

  async function signOut() {
    await repository.signOut();
    queryClient.clear();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 overflow-y-auto border-r px-4 py-6 md:flex">
        <Link to="/home" className="mb-5 px-3">
          <Logo />
        </Link>
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ to, labelKey, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  active && "bg-accent text-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{t(labelKey)}</span>
                {to === "/notifications" && unread > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <Link
          to="/premium"
          className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-xs text-gold transition-colors hover:bg-gold/15"
        >
          <span className="flex items-center gap-2 font-semibold">
            <Crown className="h-4 w-4" /> {t("premium.title")}
          </span>
          <span className="mt-1 block text-gold/80">{t("netmach.premiumBody")}</span>
        </Link>

        <div className="mt-auto pt-4">
          {me && (
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-xl p-2 transition-colors hover:bg-secondary"
            >
              <UserAvatar name={me.fullName} url={me.avatarUrl} className="h-9 w-9" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{me.fullName}</span>
                <span className="block truncate text-xs text-muted-foreground">@{me.username}</span>
              </span>
            </Link>
          )}
          <button
            type="button"
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> {t("nav.logout")}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/90 px-3 py-2.5 backdrop-blur md:px-6">
          <Link to="/home" className="shrink-0 md:hidden">
            <Logo className="h-6" />
          </Link>
          <Link
            to="/search"
            className="ml-auto flex min-w-0 flex-1 items-center gap-2 rounded-full border bg-surface-2/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground md:ml-0 md:max-w-sm"
            aria-label={t("search.title")}
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate md:hidden">{t("search.title")}</span>
            <span className="hidden min-w-0 truncate md:inline">{t("search.placeholder")}</span>
          </Link>
          <Link
            to="/notifications"
            className="relative shrink-0 rounded-full p-2 text-muted-foreground hover:text-foreground"
            aria-label={t("nav.notifications")}
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </Link>
          <div className="hidden w-36 sm:block">
            <LanguageSelect className="h-8 w-full text-xs" />
          </div>
          {me && (
            <Link to="/profile" className="shrink-0 md:hidden" aria-label={t("nav.profile")}>
              <UserAvatar name={me.fullName} url={me.avatarUrl} className="h-8 w-8" />
            </Link>
          )}
        </header>

        {isDemo && (
          <div className="flex items-start gap-2 border-b border-primary/20 bg-primary-deep/30 px-3 py-2 text-[11px] text-accent-foreground md:px-6">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              <strong className="font-semibold">{t("common.demoMode")}:</strong>{" "}
              {t("common.demoNotice")}
            </p>
          </div>
        )}

        <main className="min-w-0 flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {MOBILE_NAV.map(({ to, labelKey, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground",
                active && "text-primary",
              )}
            >
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
              <Icon className="h-5 w-5" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
