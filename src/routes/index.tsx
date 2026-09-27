import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SearchBar, SectionHeader, TopBar } from "@/components/netclub/AppShell";
import { ClubCard, PersonBubble, PostCard } from "@/components/netclub/Cards";
import { clubs, nearby, posts } from "@/lib/mock";
import heroArt from "@/assets/hero-network.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NetClub — Connect. Share. Grow together." },
      {
        name: "description",
        content:
          "NetClub é a rede de networking onde pessoas encontram pessoas, entram em clubes de seus interesses e criam conexões reais.",
      },
      { property: "og:title", content: "NetClub — Connect. Share. Grow together." },
      {
        property: "og:description",
        content: "Networking, comunidades e oportunidades em um só ecossistema.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <AppShell>
      <TopBar />
      <div className="rise-in space-y-8 px-5 pt-4">
        <SearchBar placeholder="Buscar pessoas, clubes ou temas..." />

        <section className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">Bem-vindo de volta, Alex 👋</p>
            <h1 className="mt-1.5 text-[30px] font-extrabold leading-[1.1] tracking-tight">
              Connect. Share.
              <br />
              Grow <span className="text-primary">together.</span>
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              Join meaningful conversations and build connections that matter.
            </p>
          </div>
          <img
            src={heroArt}
            alt=""
            width={816}
            height={816}
            className="h-28 w-28 shrink-0 opacity-90 mix-blend-screen sm:h-36 sm:w-36"
          />
        </section>

        <section>
          <SectionHeader title="People nearby" action="See all" to="/network" />
          <div className="no-scrollbar -mx-5 flex gap-3.5 overflow-x-auto px-5 pb-1">
            {nearby.map((p) => (
              <PersonBubble key={p.id} person={p} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Explore Clubs" action="View all" to="/clubs" />
          <div className="no-scrollbar -mx-5 flex gap-3.5 overflow-x-auto px-5 pb-1">
            {clubs.slice(0, 4).map((c) => (
              <ClubCard key={c.id} club={c} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="From your network" />
          <div className="space-y-3.5">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
