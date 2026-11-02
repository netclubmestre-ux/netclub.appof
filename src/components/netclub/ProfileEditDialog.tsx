import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useRepository } from "@/data/provider";
import { RepositoryError } from "@/data/repository";
import {
  EXPERIENCES,
  GOALS,
  SKILLS,
  type Experience,
  type GoalId,
  type Profile,
  type SkillId,
} from "@/data/types";
import { Tag } from "./Tag";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProfileEditDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
}) {
  const { t } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    fullName: profile.fullName,
    username: profile.username,
    headline: profile.headline,
    area: profile.area,
    location: profile.location,
    bio: profile.bio,
    experience: profile.experience as Experience,
    skills: profile.skills as SkillId[],
    interests: profile.interests as SkillId[],
    goals: profile.goals as GoalId[],
    lookingFor: profile.lookingFor,
    offering: profile.offering,
  });
  const [portfolio, setPortfolio] = useState(profile.portfolio);
  const [links, setLinks] = useState(profile.links);

  useEffect(() => {
    if (!open) return;
    setForm({
      fullName: profile.fullName,
      username: profile.username,
      headline: profile.headline,
      area: profile.area,
      location: profile.location,
      bio: profile.bio,
      experience: profile.experience,
      skills: profile.skills,
      interests: profile.interests,
      goals: profile.goals,
      lookingFor: profile.lookingFor,
      offering: profile.offering,
    });
    setPortfolio(profile.portfolio);
    setLinks(profile.links);
  }, [open, profile]);

  function toggle<T>(list: T[], value: T) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  const save = useMutation({
    mutationFn: () =>
      repository.updateProfile({
        ...form,
        portfolio: portfolio.filter((item) => item.title.trim()),
        links: links.filter((item) => item.label.trim() && item.url.trim()),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["profile", profile.id] });
      void queryClient.invalidateQueries({ queryKey: ["directory"] });
      void queryClient.invalidateQueries({ queryKey: ["people"] });
      onOpenChange(false);
      toast.success(t("profile.profileSaved"));
    },
    onError: (error) => {
      if (error instanceof RepositoryError && error.message === "username_taken") {
        toast.error(t("onboarding.usernameTaken"));
      } else {
        toast.error(t("errors.generic"));
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("profile.editProfile")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-fullName">{t("onboarding.fullName")} *</Label>
              <Input
                id="edit-fullName"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-username">{t("onboarding.username")} *</Label>
              <Input
                id="edit-username"
                value={form.username}
                onChange={(event) =>
                  setForm({
                    ...form,
                    username: event.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-headline">{t("onboarding.headline")}</Label>
              <Input
                id="edit-headline"
                value={form.headline}
                onChange={(event) => setForm({ ...form, headline: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-area">{t("onboarding.area")}</Label>
              <Input
                id="edit-area"
                value={form.area}
                onChange={(event) => setForm({ ...form, area: event.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-location">{t("onboarding.location")}</Label>
              <Input
                id="edit-location"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-bio">{t("onboarding.bio")}</Label>
              <Textarea
                id="edit-bio"
                value={form.bio}
                maxLength={400}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("profile.experience")}</Label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCES.map((experience) => (
                <Tag
                  key={experience}
                  active={form.experience === experience}
                  onClick={() => setForm({ ...form, experience })}
                >
                  {t(`experience.${experience}`)}
                </Tag>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("profile.skills")}</Label>
            <div className="flex flex-wrap gap-2">
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

          <div className="space-y-2">
            <Label>{t("profile.interests")}</Label>
            <div className="flex flex-wrap gap-2">
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

          <div className="space-y-2">
            <Label>{t("profile.goals")}</Label>
            <div className="flex flex-wrap gap-2">
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
              <Label htmlFor="edit-lookingFor">{t("profile.lookingFor")}</Label>
              <Textarea
                id="edit-lookingFor"
                value={form.lookingFor}
                onChange={(event) => setForm({ ...form, lookingFor: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-offering">{t("profile.offering")}</Label>
              <Textarea
                id="edit-offering"
                value={form.offering}
                onChange={(event) => setForm({ ...form, offering: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("profile.portfolio")}</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setPortfolio([
                    ...portfolio,
                    { id: crypto.randomUUID(), title: "", description: "", year: "" },
                  ])
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> {t("profile.addPortfolio")}
              </Button>
            </div>
            {portfolio.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("profile.noPortfolio")}</p>
            )}
            {portfolio.map((item, index) => (
              <div key={item.id} className="space-y-2 rounded-xl border p-3">
                <div className="flex gap-2">
                  <Input
                    value={item.title}
                    placeholder={t("profile.itemTitle")}
                    aria-label={t("profile.itemTitle")}
                    onChange={(event) => {
                      const next = [...portfolio];
                      next[index] = { ...item, title: event.target.value };
                      setPortfolio(next);
                    }}
                  />
                  <Input
                    value={item.year ?? ""}
                    placeholder={t("profile.yearField")}
                    aria-label={t("profile.yearField")}
                    className="w-24 shrink-0"
                    onChange={(event) => {
                      const next = [...portfolio];
                      next[index] = { ...item, year: event.target.value };
                      setPortfolio(next);
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={t("profile.removeItem")}
                    onClick={() => setPortfolio(portfolio.filter((entry) => entry.id !== item.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={item.description}
                  placeholder={t("profile.itemDescription")}
                  aria-label={t("profile.itemDescription")}
                  onChange={(event) => {
                    const next = [...portfolio];
                    next[index] = { ...item, description: event.target.value };
                    setPortfolio(next);
                  }}
                />
                <Input
                  value={item.url ?? ""}
                  placeholder={t("profile.urlField")}
                  aria-label={t("profile.urlField")}
                  onChange={(event) => {
                    const next = [...portfolio];
                    next[index] = { ...item, url: event.target.value };
                    setPortfolio(next);
                  }}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("profile.links")}</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setLinks([...links, { id: crypto.randomUUID(), label: "", url: "" }])
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> {t("profile.addLink")}
              </Button>
            </div>
            {links.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("profile.noLinks")}</p>
            )}
            {links.map((item, index) => (
              <div key={item.id} className="flex gap-2">
                <Input
                  value={item.label}
                  placeholder={t("profile.linkLabel")}
                  aria-label={t("profile.linkLabel")}
                  className="w-32 shrink-0"
                  onChange={(event) => {
                    const next = [...links];
                    next[index] = { ...item, label: event.target.value };
                    setLinks(next);
                  }}
                />
                <Input
                  value={item.url}
                  placeholder={t("profile.linkUrl")}
                  aria-label={t("profile.linkUrl")}
                  onChange={(event) => {
                    const next = [...links];
                    next[index] = { ...item, url: event.target.value };
                    setLinks(next);
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t("profile.removeItem")}
                  onClick={() => setLinks(links.filter((entry) => entry.id !== item.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || !form.fullName.trim() || !form.username.trim()}
          >
            {save.isPending ? t("common.saving") : t("profile.saveProfile")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
