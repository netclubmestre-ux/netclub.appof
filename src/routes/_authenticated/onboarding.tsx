import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import { meQuery } from "@/data/queries";
import { RepositoryError } from "@/data/dev-repository";
import {
  EXPERIENCES,
  GOALS,
  SKILLS,
  type Experience,
  type GoalId,
  type SkillId,
} from "@/data/types";
import { UserAvatar } from "@/components/netclub/UserAvatar";
import { Tag } from "@/components/netclub/Tag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [{ title: "Onboarding — NetClub" }],
  }),
  component: OnboardingPage,
});

const TOTAL = 4;

function OnboardingPage() {
  const { t } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: me } = useQuery(meQuery);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    headline: "",
    area: "",
    bio: "",
    location: "",
    experience: "beginner" as Experience,
    skills: [] as SkillId[],
    interests: [] as SkillId[],
    goals: [] as GoalId[],
    lookingFor: "",
    offering: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    setForm({
      fullName: me.fullName,
      username: me.username,
      headline: me.headline,
      area: me.area,
      bio: me.bio,
      location: me.location,
      experience: me.experience,
      skills: me.skills,
      interests: me.interests,
      goals: me.goals,
      lookingFor: me.lookingFor,
      offering: me.offering,
    });
    setAvatarUrl(me.avatarUrl ?? null);
  }, [me]);

  function toggle<T>(list: T[], value: T) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  function next() {
    if (step === 0) {
      if (
        !form.fullName.trim() ||
        !form.username.trim() ||
        !form.headline.trim() ||
        !form.area.trim()
      ) {
        toast.error(t("onboarding.required"));
        return;
      }
    }
    if (step === 2 && form.skills.length === 0) {
      toast.error(t("onboarding.selectOne"));
      return;
    }
    if (step === 3 && form.goals.length === 0) {
      toast.error(t("onboarding.selectOne"));
      return;
    }
    setStep((current) => Math.min(current + 1, TOTAL));
  }

  async function finish() {
    setSaving(true);
    try {
      await repository.completeOnboarding({ ...form, avatarUrl });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setStep(TOTAL);
    } catch (error) {
      if (error instanceof RepositoryError && error.message === "username_taken") {
        toast.error(t("onboarding.usernameTaken"));
      } else {
        toast.error(t("errors.generic"));
      }
    } finally {
      setSaving(false);
    }
  }

  if (step === TOTAL) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-deep">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">{t("onboarding.completeTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("onboarding.completeBody")}</p>
        <Button className="mt-6" onClick={() => navigate({ to: "/home", replace: true })}>
          {t("onboarding.goHome")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{t("onboarding.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("onboarding.subtitle")}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {t("onboarding.stepOf", { current: step + 1, total: TOTAL })}
        </span>
      </div>

      <div className="mt-4 flex gap-1.5">
        {Array.from({ length: TOTAL }).map((_, index) => (
          <span
            key={index}
            className={cn("h-1.5 flex-1 rounded-full", index <= step ? "bg-primary" : "bg-border")}
          />
        ))}
      </div>

      <div className="surface mt-5 p-5 fade-up">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold">{t("onboarding.basicTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("onboarding.basicBody")}</p>
            </div>

            <div className="flex items-center gap-4">
              <UserAvatar name={form.fullName || "NetClub"} url={avatarUrl} className="h-16 w-16" />
              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground hover:text-primary">
                  <Upload className="h-4 w-4" /> {t("onboarding.avatar")}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) setAvatarUrl(URL.createObjectURL(file));
                    }}
                  />
                </label>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("onboarding.uploadNote")}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">{t("onboarding.fullName")} *</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username">{t("onboarding.username")} *</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      username: event.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""),
                    })
                  }
                />
                <p className="text-[11px] text-muted-foreground">{t("onboarding.usernameHint")}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="headline">{t("onboarding.headline")} *</Label>
                <Input
                  id="headline"
                  value={form.headline}
                  placeholder={t("onboarding.headlinePlaceholder")}
                  onChange={(event) => setForm({ ...form, headline: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="area">{t("onboarding.area")} *</Label>
                <Input
                  id="area"
                  value={form.area}
                  onChange={(event) => setForm({ ...form, area: event.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="location">{t("onboarding.location")}</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="bio">{t("onboarding.bio")}</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  maxLength={400}
                  placeholder={t("onboarding.bioPlaceholder")}
                  onChange={(event) => setForm({ ...form, bio: event.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">
              {t("onboarding.experienceTitle")}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {EXPERIENCES.map((experience) => (
                <button
                  key={experience}
                  type="button"
                  onClick={() => setForm({ ...form, experience })}
                  aria-pressed={form.experience === experience}
                  className={cn(
                    "rounded-xl border p-4 text-left text-sm transition-colors",
                    form.experience === experience
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border bg-surface-2 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="font-semibold">{t(`experience.${experience}`)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-lg font-semibold">{t("onboarding.skillsTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("onboarding.skillsBody")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <Tag
                    key={skill}
                    active={form.skills.includes(skill)}
                    onClick={() => setForm({ ...form, skills: toggle(form.skills, skill) })}
                  >
                    {t(`skill.${skill}`)}
                  </Tag>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">
                {t("onboarding.interestsTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("onboarding.interestsBody")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <Tag
                    key={skill}
                    active={form.interests.includes(skill)}
                    onClick={() => setForm({ ...form, interests: toggle(form.interests, skill) })}
                  >
                    {t(`skill.${skill}`)}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-lg font-semibold">{t("onboarding.goalsTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("onboarding.goalsBody")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {GOALS.map((goal) => (
                  <Tag
                    key={goal}
                    active={form.goals.includes(goal)}
                    onClick={() => setForm({ ...form, goals: toggle(form.goals, goal) })}
                  >
                    {t(`goal.${goal}`)}
                  </Tag>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lookingFor">{t("onboarding.lookingFor")}</Label>
                <Textarea
                  id="lookingFor"
                  value={form.lookingFor}
                  placeholder={t("onboarding.lookingForPlaceholder")}
                  onChange={(event) => setForm({ ...form, lookingFor: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="offering">{t("onboarding.offering")}</Label>
                <Textarea
                  id="offering"
                  value={form.offering}
                  placeholder={t("onboarding.offeringPlaceholder")}
                  onChange={(event) => setForm({ ...form, offering: event.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> {t("common.back")}
          </Button>
          {step < TOTAL - 1 ? (
            <Button onClick={next}>{t("common.next")}</Button>
          ) : (
            <Button onClick={finish} disabled={saving}>
              {saving ? t("common.saving") : t("common.finish")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
