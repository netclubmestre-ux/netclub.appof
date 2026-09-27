import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, AvatarStack, SectionHeader, TopBar } from "@/components/netclub/AppShell";
import { ClubCard, JoinButton, PostCard } from "@/components/netclub/Cards";
import { clubs, people, posts } from "@/lib/mock";

export const Route = createFileRoute("/clubs/$clubId")({
  loader: ({ params }) => {
    const club = clubs.find((c) => c.id === params.clubId);
    if (!club) throw notFound();
    return { club };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.club.name ?? "Club";
    return {
      meta: [
        { title: `${name} — NetClub` },
        { name: "description", content: loaderData?.club.desc ?? "Comunidade na NetClub." },
        { property: "og:title", content: `${name} — NetClub` },
        {
          property: "og:description",
          content: loaderData?.club.desc ?? "Comunidade na NetClub.",
        },
      ],
    };
  },
  component: ClubPage,
});

const tabs = ["Overview", "Posts", "Members", "About"] as const;

function ClubPage() {
  const { club } = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const members = people.slice(0, 5);

  return (
    <AppShell>
      <TopBar title={club.name} back={{ to: "/clubs" }} />
      <div className="rise-in pb-6">
        <div className="relative h-44">
          <img
            src={club.cover}
            alt=""
            className="h-full w-full object-cover opacity-80"
            width={1024}
            height={656}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="relative z-10 -mt-10 space-y-4 px-5">
          <span
            className={`grid h-14 w-14 place-items-center rounded-2xl text-lg font-bold ${
              club.accent === "gold" ? "bg-gold text-background" : "bg-primary text-primary-foreground"
            }`}
          >
            {club.icon}
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{club.name}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {club.members} members ·{" "}
              <span className="text-primary">{club.online} online</span> · {club.category}
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{club.desc}</p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <AvatarStack imgs={members.map((m) => m.img)} extra={245} />
            <JoinButton />
          </div>

          <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 border-b-2 px-3.5 pb-2.5 text-sm font-semibold transition-colors ${
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Members" ? (
            <div className="space-y-3">
              {members.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3">
                  <img
                    src={m.img}
                    alt={m.name}
                    loading="lazy"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.role}</p>
                  </div>
                  {i < 2 ? (
                    <span className="shrink-0 rounded-full border border-gold/40 px-2.5 py-1 text-[10px] font-bold text-gold">
                      Admin
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {tab === "About" ? (
            <div className="surface-card space-y-3 p-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                {club.desc} O clube acontece em conversas diárias, encontros ao vivo semanais e
                threads de perguntas abertas.
              </p>
              <p>Criado em 2023 · Comunidade moderada · Entrada livre.</p>
            </div>
          ) : null}

          {tab === "Overview" || tab === "Posts" ? (
            <div className="space-y-3.5">
              {(tab === "Overview" ? posts.slice(0, 2) : posts).map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ) : null}

          {tab === "Overview" ? (
            <section className="pt-2">
              <SectionHeader title="Clubes relacionados" />
              <div className="no-scrollbar -mx-5 flex gap-3.5 overflow-x-auto px-5 pb-1">
                {clubs
                  .filter((c) => c.id !== club.id)
                  .slice(0, 4)
                  .map((c) => (
                    <ClubCard key={c.id} club={c} />
                  ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
