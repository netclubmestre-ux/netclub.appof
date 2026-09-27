import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, SearchBar, SectionHeader, TopBar } from "@/components/netclub/AppShell";
import { PersonBubble, PersonRow } from "@/components/netclub/Cards";
import { people, nearby } from "@/lib/mock";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "Your Network — NetClub" },
      {
        name: "description",
        content: "Descubra pessoas, veja conexões em comum e expanda sua rede na NetClub.",
      },
      { property: "og:title", content: "Your Network — NetClub" },
      {
        property: "og:description",
        content: "Descubra pessoas e crie conexões que geram oportunidades.",
      },
    ],
  }),
  component: Network,
});

const filters = ["All", "Nearby", "Suggested", "New"] as const;

function Network() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const list =
    filter === "All" ? people : people.filter((p) => p.tag === filter.toLowerCase());

  return (
    <AppShell>
      <TopBar title="Your Network" />
      <div className="rise-in space-y-6 px-5 pt-4">
        <SearchBar placeholder="Buscar pessoas por nome, cargo ou clube..." />

        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {list.map((p) => (
            <PersonRow key={p.id} person={p} />
          ))}
          {list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma pessoa neste filtro por enquanto.
            </p>
          ) : null}
        </div>

        <section>
          <SectionHeader title="People you may know" />
          <div className="no-scrollbar -mx-5 flex gap-3.5 overflow-x-auto px-5 pb-1">
            {nearby.map((p) => (
              <PersonBubble key={p.id} person={p} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
