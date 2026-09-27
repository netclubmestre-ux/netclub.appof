import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, SearchBar, TopBar } from "@/components/netclub/AppShell";
import { ClubCard, JoinButton } from "@/components/netclub/Cards";
import { categories, clubs } from "@/lib/mock";

export const Route = createFileRoute("/clubs/")({
  head: () => ({
    meta: [
      { title: "Explore Clubs — NetClub" },
      {
        name: "description",
        content:
          "Encontre clubes de tecnologia, marketing, criadores, negócios e mais dentro da NetClub.",
      },
      { property: "og:title", content: "Explore Clubs — NetClub" },
      {
        property: "og:description",
        content: "Comunidades de qualquer nicho, em um único ecossistema.",
      },
    ],
  }),
  component: Clubs,
});

function Clubs() {
  const [cat, setCat] = useState("All");
  const list = cat === "All" ? clubs : clubs.filter((c) => c.category === cat);

  return (
    <AppShell>
      <TopBar title="Explore Clubs" />
      <div className="rise-in space-y-6 px-5 pt-4">
        <SearchBar placeholder="Buscar clubes e comunidades..." />

        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
                cat === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-3.5">
          {list.map((club) => (
            <div key={club.id} className="space-y-3">
              <ClubCard club={club} wide />
              <div className="flex items-center justify-between gap-3 px-1">
                <span className="text-xs text-muted-foreground">
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />
                  {club.online} online agora
                </span>
                <JoinButton />
              </div>
            </div>
          ))}
          {list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Ainda não há clubes nessa categoria.
            </p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
