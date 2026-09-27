import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { AppShell, TopBar } from "@/components/netclub/AppShell";
import { messages, people } from "@/lib/mock";

export const Route = createFileRoute("/chat/$personId")({
  loader: ({ params }) => {
    const person = people.find((p) => p.id === params.personId);
    if (!person) throw notFound();
    return { person };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.person.name ?? "Conversa";
    return {
      meta: [
        { title: `${name} — NetClub` },
        { name: "description", content: `Conversa com ${name} na NetClub.` },
        { property: "og:title", content: `${name} — NetClub` },
        { property: "og:description", content: `Conversa com ${name} na NetClub.` },
      ],
    };
  },
  component: Conversation,
});

function Conversation() {
  const { person } = Route.useLoaderData();
  const [thread, setThread] = useState(
    messages[person.id] ?? [
      { me: false, text: `Oi! Prazer, sou ${person.name.split(" ")[0]} 👋`, time: "10:02" },
    ],
  );
  const [draft, setDraft] = useState("");

  const send = () => {
    if (!draft.trim()) return;
    setThread((t) => [
      ...t,
      { me: true, text: draft.trim(), time: new Date().toTimeString().slice(0, 5) },
    ]);
    setDraft("");
  };

  return (
    <AppShell>
      <TopBar title={person.name} back={{ to: "/chat" }} />
      <div className="rise-in flex min-h-[calc(100vh-9rem)] flex-col">
        <div className="flex items-center gap-3 border-b border-border/60 px-5 py-3">
          <img
            src={person.img}
            alt={person.name}
            className="h-11 w-11 rounded-full object-cover"
            loading="lazy"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{person.name}</p>
            <p className="truncate text-xs text-primary">online agora</p>
          </div>
        </div>

        <div className="flex-1 space-y-2.5 px-5 py-5">
          {thread.map((m, i) => (
            <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.me
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border border-border bg-card text-foreground"
                }`}
              >
                {m.text}
                <span
                  className={`mt-1 block text-[10px] ${
                    m.me ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {m.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-20 mx-5 mb-2 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 lg:bottom-4">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Write a message..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={send}
            aria-label="Enviar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
