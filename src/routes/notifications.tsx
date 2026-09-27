import { createFileRoute } from "@tanstack/react-router";
import { AppShell, TopBar } from "@/components/netclub/AppShell";
import { notifications } from "@/lib/mock";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notificações — NetClub" },
      {
        name: "description",
        content: "Novas conexões, menções e discussões dos seus clubes na NetClub.",
      },
      { property: "og:title", content: "Notificações — NetClub" },
      { property: "og:description", content: "Acompanhe o que acontece na sua rede." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  return (
    <AppShell>
      <TopBar title="Notificações" back={{ to: "/" }} />
      <div className="rise-in space-y-2.5 px-5 pt-4">
        {notifications.map((n) => (
          <div key={n.id} className="surface-card flex items-start gap-3 p-4">
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                n.kind === "gold" ? "bg-gold" : "bg-primary"
              }`}
            />
            <div className="min-w-0">
              <p className="text-sm leading-relaxed">{n.text}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
