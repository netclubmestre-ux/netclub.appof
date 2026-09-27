import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, SearchBar, TopBar } from "@/components/netclub/AppShell";
import { conversations, people } from "@/lib/mock";

export const Route = createFileRoute("/chat/")({
  head: () => ({
    meta: [
      { title: "Mensagens — NetClub" },
      {
        name: "description",
        content: "Converse com suas conexões e mantenha o networking vivo na NetClub.",
      },
      { property: "og:title", content: "Mensagens — NetClub" },
      { property: "og:description", content: "Suas conversas e conexões em um só lugar." },
    ],
  }),
  component: ChatList,
});

function ChatList() {
  return (
    <AppShell>
      <TopBar title="Mensagens" />
      <div className="rise-in space-y-5 px-5 pt-4">
        <SearchBar placeholder="Buscar conversas..." />
        <div className="divide-y divide-border/70">
          {conversations.map((c) => {
            const person = people.find((p) => p.id === c.id)!;
            return (
              <Link
                key={c.id}
                to="/chat/$personId"
                params={{ personId: c.id }}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3.5 transition-colors hover:bg-secondary/40"
              >
                <img
                  src={person.img}
                  alt={person.name}
                  loading="lazy"
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{person.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.last}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-[11px] text-muted-foreground">{c.time}</span>
                  {c.unread ? (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {c.unread}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
