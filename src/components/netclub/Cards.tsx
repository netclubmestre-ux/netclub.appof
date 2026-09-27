import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark, Heart, MessageSquare, Share2, TrendingUp } from "lucide-react";
import { AvatarStack } from "./AppShell";
import { avatar, people, type Club, type Person, type Post } from "@/lib/mock";

export function ConnectButton({ compact = false }: { compact?: boolean }) {
  const [on, setOn] = useState(false);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
        on
          ? "border border-border bg-secondary text-muted-foreground"
          : "bg-primary text-primary-foreground hover:bg-primary-dim"
      } ${compact ? "px-3.5 py-1.5" : ""}`}
    >
      {on ? "Pendente" : "Connect"}
    </button>
  );
}

export function JoinButton({ full = false }: { full?: boolean }) {
  const [on, setOn] = useState(false);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all active:scale-95 ${
        full ? "w-full" : ""
      } ${
        on
          ? "border border-primary/40 bg-transparent text-primary"
          : "bg-primary text-primary-foreground hover:bg-primary-dim"
      }`}
    >
      {on ? "Member ✓" : "Join Club"}
    </button>
  );
}

export function PersonBubble({ person }: { person: Person }) {
  const [added, setAdded] = useState(false);
  return (
    <div className="flex w-[74px] shrink-0 flex-col items-center gap-1.5">
      <div className="relative">
        <Link to="/network" className="block rounded-full p-[2px] ring-1 ring-primary/40">
          <img
            src={person.img}
            alt={person.name}
            loading="lazy"
            className="h-[60px] w-[60px] rounded-full object-cover"
          />
        </Link>
        <button
          onClick={() => setAdded((v) => !v)}
          aria-label={`Conectar com ${person.name}`}
          className={`absolute -bottom-0.5 -right-0.5 grid h-[22px] w-[22px] place-items-center rounded-full border-2 border-background text-xs font-bold transition-transform active:scale-90 ${
            added ? "bg-gold text-background" : "bg-primary text-primary-foreground"
          }`}
        >
          {added ? "✓" : "+"}
        </button>
      </div>
      <span className="w-full truncate text-center text-xs font-medium text-foreground">
        {person.name.split(" ")[0]}
      </span>
    </div>
  );
}

export function PersonRow({ person }: { person: Person }) {
  return (
    <div className="surface-card grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3.5">
      <img
        src={person.img}
        alt={person.name}
        loading="lazy"
        className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-border"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{person.name}</p>
        <p className="truncate text-xs text-muted-foreground">{person.role}</p>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          <span className="text-primary">{person.clubs.join(" · ")}</span> • {person.location}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {person.mutual} mutual connections
        </p>
      </div>
      <ConnectButton compact />
    </div>
  );
}

export function ClubCard({ club, wide = false }: { club: Club; wide?: boolean }) {
  return (
    <Link
      to="/clubs/$clubId"
      params={{ clubId: club.id }}
      className={`surface-card group block overflow-hidden transition-transform hover:-translate-y-0.5 ${
        wide ? "w-full" : "w-[196px] shrink-0"
      }`}
    >
      <div className="relative h-24 overflow-hidden">
        <img
          src={club.cover}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <span
          className={`absolute bottom-2 left-3 grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${
            club.accent === "gold" ? "bg-gold text-background" : "bg-primary text-primary-foreground"
          }`}
        >
          {club.icon}
        </span>
      </div>
      <div className="p-3.5 pt-2.5">
        <p className="truncate text-sm font-bold">{club.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{club.members} members</p>
        {wide ? (
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{club.desc}</p>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-2">
          <AvatarStack imgs={[avatar(5), avatar(12), avatar(9), avatar(45)]} extra={245} />
          <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
            <TrendingUp className="h-3 w-3" /> {club.growth}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PostCard({ post }: { post: Post }) {
  const author = people.find((p) => p.id === post.authorId)!;
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <article className="surface-card p-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
        <img
          src={author.img}
          alt={author.name}
          loading="lazy"
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-bold">
            {author.name}
            <span className="text-primary">✓</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {author.role} · {post.club}
          </p>
          <p className="text-[11px] text-muted-foreground">{post.time}</p>
        </div>
        <span className="shrink-0 text-muted-foreground">···</span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground/90">{post.body}</p>

      <div className="mt-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiked((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition-colors ${
              liked ? "border-primary/50 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className="h-3.5 w-3.5" fill={liked ? "currentColor" : "none"} />
            {post.likes + (liked ? 1 : 0)}
          </button>
          <button className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {post.comments}
          </button>
          <button
            aria-label="Compartilhar"
            className="hidden rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <AvatarStack imgs={[avatar(20), avatar(33), avatar(60)]} extra={32} />
          <button
            onClick={() => setSaved((v) => !v)}
            aria-label="Salvar"
            className={`rounded-full border border-border p-1.5 transition-colors ${
              saved ? "border-gold/50 text-gold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </article>
  );
}
