import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionHeader, TopBar } from "@/components/netclub/AppShell";
import { ClubCard, PostCard } from "@/components/netclub/Cards";
import { clubs, me, posts } from "@/lib/mock";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: `${me.name} — NetClub` },
      { name: "description", content: me.bio },
      { property: "og:title", content: `${me.name} — NetClub` },
      { property: "og:description", content: me.bio },
    ],
  }),
  component: Profile,
});

function Profile() {
  const myClubs = clubs.filter((c) => me.clubIds.includes(c.id));

  return (
    <AppShell>
      <TopBar title="Profile" />
      <div className="rise-in space-y-7 px-5 pt-5">
        <section className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <img
            src={me.img}
            alt={me.name}
            className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-primary/40"
          />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold tracking-tight">{me.name}</h1>
            <p className="truncate text-sm text-muted-foreground">{me.role}</p>
            <p className="truncate text-xs text-muted-foreground">{me.location}</p>
          </div>
        </section>

        <p className="text-sm leading-relaxed text-muted-foreground">{me.bio}</p>

        <div className="grid grid-cols-3 gap-3">
          {[
            ["Connections", me.stats.connections],
            ["Clubs", me.stats.clubs],
            ["Posts", me.stats.posts],
          ].map(([label, value]) => (
            <div key={label as string} className="surface-card px-2 py-3 text-center">
              <p className="text-lg font-extrabold">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <button className="w-full rounded-full border border-primary/50 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/10">
          Edit Profile
        </button>

        <section>
          <SectionHeader title="Your Clubs" action="View all" to="/clubs" />
          <div className="no-scrollbar -mx-5 flex gap-3.5 overflow-x-auto px-5 pb-1">
            {myClubs.map((c) => (
              <ClubCard key={c.id} club={c} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Interests" />
          <div className="flex flex-wrap gap-2">
            {me.interests.map((i) => (
              <span
                key={i}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted-foreground"
              >
                {i}
              </span>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Seus posts" />
          <PostCard post={posts[0]} />
        </section>
      </div>
    </AppShell>
  );
}
