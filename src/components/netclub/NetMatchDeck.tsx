import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, Heart, MapPin, Sparkles, X } from "lucide-react";
import { useI18n } from "@/i18n";
import type { Profile } from "@/data/types";
import { sharedProfileItems } from "@/lib/netmach";
import { cn } from "@/lib/utils";
import { Tag } from "./Tag";
import { UserAvatar } from "./UserAvatar";
import { Button } from "@/components/ui/button";

type Direction = "left" | "right";

function SharedChips({ me, profile }: { me: Profile; profile: Profile }) {
  const { t } = useI18n();
  const { skills, goals } = sharedProfileItems(me, profile);
  if (skills.length === 0 && goals.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <span
          key={`skill-${skill}`}
          className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
        >
          {t(`skill.${skill}`)}
        </span>
      ))}
      {goals.map((goal) => (
        <span
          key={`goal-${goal}`}
          className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold"
        >
          {t(`goal.${goal}`)}
        </span>
      ))}
    </div>
  );
}

function WhyShown({ me, profile }: { me: Profile; profile: Profile }) {
  const { t } = useI18n();
  const { skills, interests, goals, sameArea } = sharedProfileItems(me, profile);
  const phrases: string[] = [];
  if (skills.length > 0) {
    phrases.push(
      `${t("netmach.commonSkills")}: ${skills.map((skill) => t(`skill.${skill}`)).join(", ")}`,
    );
  }
  if (interests.length > 0) {
    phrases.push(
      `${t("netmach.commonInterests")}: ${interests
        .map((interest) => t(`skill.${interest}`))
        .join(", ")}`,
    );
  }
  if (goals.length > 0) {
    phrases.push(
      `${t("netmach.commonGoals")}: ${goals.map((goal) => t(`goal.${goal}`)).join(", ")}`,
    );
  }

  const explanation =
    phrases.length > 0
      ? t("netmach.explanationCommon", { items: phrases.join(" · ") })
      : sameArea
        ? t("netmach.sameArea", { area: profile.area })
        : t("netmach.explanationDefault");

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
        <Sparkles className="h-3.5 w-3.5" /> {t("netmach.whyShown")}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{explanation}</p>
    </div>
  );
}

export function NetMatchIntro({
  me,
  profile,
  onStartDiscovery,
}: {
  me: Profile;
  profile: Profile;
  onStartDiscovery: () => void;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <section className="surface relative overflow-hidden border-primary/25 fade-up">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 0%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 60%)",
        }}
        aria-hidden
      />
      <div className="relative p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {t("netmach.introEyebrow")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> {t("netmach.realProfile")}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => navigate({ to: "/members/$id", params: { id: profile.id } })}
            className="relative mx-auto shrink-0 sm:mx-0"
            aria-label={t("netmach.openProfile")}
          >
            <UserAvatar
              name={profile.fullName}
              url={profile.avatarUrl}
              className="h-24 w-24 border-4 border-card text-2xl shadow-lg sm:h-28 sm:w-28"
            />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
              {t("netmach.featured")}
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold leading-tight sm:text-2xl">
              {profile.fullName}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{profile.headline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {profile.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {profile.location}
                </span>
              )}
              <span>{t(`experience.${profile.experience}`)}</span>
              {profile.area && <span>· {profile.area}</span>}
            </div>

            <div className="mt-3">
              <SharedChips me={me} profile={profile} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-2 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("netmach.lookingFor")}
            </p>
            <p className="mt-1 text-sm">{profile.lookingFor || "—"}</p>
          </div>
          <div className="rounded-xl bg-surface-2 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("netmach.offering")}
            </p>
            <p className="mt-1 text-sm">{profile.offering || "—"}</p>
          </div>
        </div>

        {profile.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.skills.slice(0, 6).map((skill) => (
              <Tag key={skill}>{t(`skill.${skill}`)}</Tag>
            ))}
          </div>
        )}

        <div className="mt-4">
          <WhyShown me={me} profile={profile} />
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={onStartDiscovery}>
            {t("netmach.startDiscovery")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate({ to: "/members/$id", params: { id: profile.id } })}
          >
            {t("netmach.openProfile")}
          </Button>
        </div>
      </div>
    </section>
  );
}

export function NetMatchDeck({
  me,
  candidates,
  onLike,
  onPass,
  pending,
}: {
  me: Profile;
  candidates: Profile[];
  onLike: (id: string) => void;
  onPass: (id: string) => void;
  pending: boolean;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [decided, setDecided] = useState<string[]>([]);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<Direction | null>(null);
  const startRef = useRef<{ x: number; y: number; at: number } | null>(null);
  const movedRef = useRef(false);
  const exitTimer = useRef<number | null>(null);

  const queue = useMemo(
    () => candidates.filter((candidate) => !decided.includes(candidate.id)),
    [candidates, decided],
  );
  const current = queue[0];
  const behind = queue.slice(1, 3);

  useEffect(() => {
    return () => {
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
    };
  }, []);

  function decide(direction: Direction) {
    if (!current || exit || pending) return;
    setExit(direction);
    setDragX(0);
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => {
      setDecided((previous) => [...previous, current.id]);
      setExit(null);
      if (direction === "right") onLike(current.id);
      else onPass(current.id);
    }, 200);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!current || exit) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    startRef.current = { x: event.clientX, y: event.clientY, at: Date.now() };
    movedRef.current = false;
    setDragging(true);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!startRef.current || exit) return;
    const deltaX = event.clientX - startRef.current.x;
    const deltaY = event.clientY - startRef.current.y;
    if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) movedRef.current = true;
    if (Math.abs(deltaX) > Math.abs(deltaY)) setDragX(deltaX);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!startRef.current) return;
    const deltaX = event.clientX - startRef.current.x;
    const elapsed = Date.now() - startRef.current.at;
    startRef.current = null;
    setDragging(false);
    setDragX(0);

    if (deltaX > 90) {
      decide("right");
      return;
    }
    if (deltaX < -90) {
      decide("left");
      return;
    }
    if (!movedRef.current && elapsed < 400 && current) {
      navigate({ to: "/members/$id", params: { id: current.id } });
    }
  }

  if (!current) return null;

  const offset = exit === "left" ? -640 : exit === "right" ? 640 : dragX;
  const rotation = offset / 22;
  const likeOpacity = Math.min(1, Math.max(0, offset / 110));
  const passOpacity = Math.min(1, Math.max(0, -offset / 110));

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("netmach.deckTitle")}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("netmach.deckSubtitle")}</p>
        </div>
        <span className="shrink-0 rounded-full border bg-surface-2 px-2.5 py-1 text-[11px] text-muted-foreground">
          {t("netmach.cardCounter", {
            current: Math.min(decided.length + 1, candidates.length),
            total: candidates.length,
          })}
        </span>
      </div>

      <div className="relative mx-auto w-full max-w-md">
        {behind
          .slice()
          .reverse()
          .map((profile, reverseIndex) => {
            const depth = behind.length - reverseIndex;
            return (
              <div
                key={profile.id}
                aria-hidden
                className="absolute inset-0 rounded-2xl border bg-card"
                style={{
                  transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.035})`,
                  zIndex: 1,
                }}
              />
            );
          })}

        <div
          role="group"
          aria-label={t("netmach.tapProfile")}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn(
            "surface relative z-10 select-none overflow-hidden p-0 fade-up",
            dragging ? "cursor-grabbing" : "cursor-grab",
          )}
          style={{
            transform: `translateX(${offset}px) rotate(${rotation}deg)`,
            transition: dragging ? "none" : "transform 0.22s ease-out",
            touchAction: "pan-y",
          }}
        >
          <div className="relative h-24 bg-gradient-to-r from-primary-deep via-card to-gold/20">
            <div className="absolute inset-x-0 bottom-0 flex justify-center">
              <UserAvatar
                name={current.fullName}
                url={current.avatarUrl}
                className="h-20 w-20 translate-y-8 border-4 border-card text-xl shadow-lg"
              />
            </div>
            <span
              className="absolute left-4 top-3 rounded-lg border-2 border-primary bg-background/70 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-primary"
              style={{ opacity: likeOpacity }}
              aria-hidden
            >
              {t("netmach.like")}
            </span>
            <span
              className="absolute right-4 top-3 rounded-lg border-2 border-destructive bg-background/70 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-destructive"
              style={{ opacity: passOpacity }}
              aria-hidden
            >
              {t("netmach.pass")}
            </span>
          </div>

          <div className="px-5 pb-5 pt-10">
            <div className="text-center">
              <h3 className="truncate text-xl font-bold">{current.fullName}</h3>
              <p className="truncate text-sm text-muted-foreground">{current.headline}</p>
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {current.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {current.location}
                  </span>
                )}
                <span>{t(`experience.${current.experience}`)}</span>
                {current.area && <span>· {current.area}</span>}
              </div>
            </div>

            {current.bio && (
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {current.bio}
              </p>
            )}

            {current.skills.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("netmach.skills")}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {current.skills.slice(0, 5).map((skill) => (
                    <Tag key={skill}>{t(`skill.${skill}`)}</Tag>
                  ))}
                </div>
              </div>
            )}

            {current.goals.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("netmach.goals")}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {current.goals.slice(0, 4).map((goal) => (
                    <Tag key={goal}>{t(`goal.${goal}`)}</Tag>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-surface-2 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("netmach.lookingFor")}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs">{current.lookingFor || "—"}</p>
              </div>
              <div className="rounded-xl bg-surface-2 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("netmach.offering")}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs">{current.offering || "—"}</p>
              </div>
            </div>

            <div className="mt-3">
              <SharedChips me={me} profile={current} />
            </div>

            <div
              className="mt-4 flex items-center justify-center gap-3"
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
            >
              <Button
                type="button"
                variant="secondary"
                className="h-12 w-12 rounded-full border border-destructive/30 p-0 text-destructive hover:bg-destructive/10"
                aria-label={t("netmach.pass")}
                title={t("netmach.pass")}
                onClick={(event) => {
                  event.stopPropagation();
                  decide("left");
                }}
                disabled={pending || Boolean(exit)}
              >
                <X className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-11 rounded-full px-4"
                aria-label={t("netmach.openProfile")}
                title={t("netmach.openProfile")}
                onClick={(event) => {
                  event.stopPropagation();
                  navigate({ to: "/members/$id", params: { id: current.id } });
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                className="h-12 w-12 rounded-full p-0"
                aria-label={t("netmach.like")}
                title={t("netmach.like")}
                onClick={(event) => {
                  event.stopPropagation();
                  decide("right");
                }}
                disabled={pending || Boolean(exit)}
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {t("netmach.swipeHint")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
