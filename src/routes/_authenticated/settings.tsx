import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Database,
  Globe2,
  LogOut,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useDataMode, useRepository } from "@/data/provider";
import {
  blockedProfilesQuery,
  deletionRequestQuery,
  meQuery,
  reportsQuery,
  settingsQuery,
  termsAcceptancesQuery,
} from "@/data/queries";
import type { UserSettings } from "@/data/types";
import { PageHeader } from "@/components/netclub/PageHeader";
import { LanguageSelect } from "@/components/netclub/LanguageSelect";
import { UserAvatar } from "@/components/netclub/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — NetClub" },
      { name: "description", content: "Idioma, privacidade, conta e documentos legais." },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(meQuery),
      queryClient.ensureQueryData(settingsQuery),
      queryClient.ensureQueryData(blockedProfilesQuery),
      queryClient.ensureQueryData(termsAcceptancesQuery),
      queryClient.ensureQueryData(deletionRequestQuery),
    ]),
  component: SettingsPage,
});

const DOCUMENTS = [
  { id: "terms", titleKey: "settings.terms" },
  { id: "privacy", titleKey: "settings.privacyPolicy" },
  { id: "guidelines", titleKey: "settings.guidelines" },
] as const;

const REPORT_STATUS_KEY = {
  open: "settings.reportOpen",
  reviewing: "settings.reportReviewing",
  resolved: "settings.reportResolved",
} as const;

const REPORT_TARGET_KEY = {
  user: "report.targetUser",
  post: "report.targetPost",
  comment: "report.targetComment",
  story: "report.targetStory",
  club: "report.targetClub",
} as const;

function SettingsPage() {
  const { t, language, formatDate } = useI18n();
  const repository = useRepository();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isDemo } = useDataMode();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const { data: blocked = [] } = useSuspenseQuery(blockedProfilesQuery);
  const { data: acceptances = [] } = useSuspenseQuery(termsAcceptancesQuery);
  const { data: deletionRequest } = useSuspenseQuery(deletionRequestQuery);
  const { data: reports = [] } = useQuery({
    ...reportsQuery,
    enabled: me?.role === "admin",
  });
  const [confirmText, setConfirmText] = useState("");

  const update = useMutation({
    mutationFn: (patch: Partial<UserSettings>) => repository.updateSettings(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success(t("settings.saved"));
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const unblock = useMutation({
    mutationFn: (id: string) => repository.unblockUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["blocked"] });
      void queryClient.invalidateQueries({ queryKey: ["directory"] });
      toast.success(t("profile.unblocked"));
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const accept = useMutation({
    mutationFn: () => repository.acceptTerms(["terms", "privacy", "guidelines"]),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["terms-acceptances"] });
      toast.success(t("common.success"));
    },
    onError: () => toast.error(t("errors.generic")),
  });

  const requestDeletion = useMutation({
    mutationFn: () => repository.requestAccountDeletion(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deletion-request"] });
      setConfirmText("");
      toast.success(t("settings.deletionRequested"));
    },
    onError: () => toast.error(t("errors.generic")),
  });

  async function signOut() {
    await repository.signOut();
    queryClient.clear();
    navigate({ to: "/", replace: true });
  }

  if (!me) return null;

  const confirmWord = language === "pt-BR" ? "EXCLUIR" : language === "es" ? "ELIMINAR" : "DELETE";
  const accepted = new Set(acceptances.map((item) => item.document));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="space-y-5">
        <section className="surface p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Globe2 className="h-4 w-4 text-primary" /> {t("settings.language")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("settings.languageHint")}</p>
          <div className="mt-3 max-w-xs">
            <LanguageSelect className="w-full" />
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" /> {t("settings.privacy")}
          </h2>

          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="visibility">{t("settings.profileVisibility")}</Label>
              <Select
                value={settings.profileVisibility}
                onValueChange={(value) =>
                  update.mutate({ profileVisibility: value as UserSettings["profileVisibility"] })
                }
              >
                <SelectTrigger id="visibility" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t("settings.visibilityPublic")}</SelectItem>
                  <SelectItem value="members">{t("settings.visibilityMembers")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="show-goals">{t("settings.showGoals")}</Label>
              <Switch
                id="show-goals"
                checked={settings.showGoals}
                onCheckedChange={(checked) => update.mutate({ showGoals: checked })}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="messages-from">{t("settings.messagesFrom")}</Label>
              <Select
                value={settings.allowMessagesFrom}
                onValueChange={(value) =>
                  update.mutate({
                    allowMessagesFrom: value as UserSettings["allowMessagesFrom"],
                  })
                }
              >
                <SelectTrigger id="messages-from" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connections">{t("settings.messagesConnections")}</SelectItem>
                  <SelectItem value="everyone">{t("settings.messagesEveryone")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="font-display text-lg font-semibold">{t("settings.notifications")}</h2>
          <div className="mt-4 flex items-center justify-between gap-2">
            <Label htmlFor="email-notifications">{t("settings.emailNotifications")}</Label>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => update.mutate({ emailNotifications: checked })}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {isDemo ? t("common.demoNotice") : t("settings.emailBackendNote")}
          </p>
        </section>

        <section className="surface p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <UserX className="h-4 w-4 text-primary" /> {t("settings.blocked")}
          </h2>
          {blocked.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("settings.noBlocked")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {blocked.map((profile) => (
                <li key={profile.id} className="flex items-center gap-3 py-2">
                  <UserAvatar name={profile.fullName} url={profile.avatarUrl} className="h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{profile.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => unblock.mutate(profile.id)}
                    disabled={unblock.isPending}
                  >
                    <ShieldOff className="mr-1.5 h-3.5 w-3.5" /> {t("common.unblock")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {me.role === "admin" && (
          <section className="surface p-5">
            <h2 className="font-display text-lg font-semibold">{t("settings.moderation")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t("settings.moderationHint")}</p>
            {reports.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t("settings.noReports")}</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {reports.map((report) => (
                  <li key={report.id} className="py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{report.category}</p>
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">
                        {t(REPORT_STATUS_KEY[report.status])}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t("settings.reportTarget")}: {t(REPORT_TARGET_KEY[report.targetType])} ·{" "}
                      {formatDate(report.createdAt)}
                    </p>
                    {report.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{report.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="surface p-5">
          <h2 className="font-display text-lg font-semibold">{t("settings.terms")}</h2>
          <ul className="mt-3 space-y-2">
            {DOCUMENTS.map((document) => (
              <li key={document.id} className="flex items-center justify-between gap-2">
                <Link
                  to="/legal/$doc"
                  params={{ doc: document.id }}
                  className="text-sm text-primary hover:underline"
                >
                  {t(document.titleKey)}
                </Link>
                <span className="text-[11px] text-muted-foreground">
                  {accepted.has(document.id)
                    ? t("settings.acceptedAt", {
                        date: formatDate(
                          acceptances.find((item) => item.document === document.id)!.acceptedAt,
                        ),
                      })
                    : t("settings.notAccepted")}
                </span>
              </li>
            ))}
            <li>
              <Link
                to="/legal/$doc"
                params={{ doc: "contact" }}
                className="text-sm text-primary hover:underline"
              >
                {t("settings.contact")}
              </Link>
            </li>
          </ul>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            onClick={() => accept.mutate()}
            disabled={accept.isPending}
          >
            {t("settings.acceptTerms")}
          </Button>
        </section>

        <section className="surface p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Database className="h-4 w-4 text-primary" /> {t("settings.dataMode")}
          </h2>
          <p className="mt-2 text-sm">
            {isDemo ? t("settings.dataModeDemo") : t("settings.dataModeSupabase")}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {isDemo ? t("common.demoNotice") : t("settings.dataModeNote")}
          </p>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {t("settings.version")}: 0.1.0 · NetClub MVP
          </p>
        </section>

        <section className="surface border-destructive/30 p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" /> {t("settings.dangerZone")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.deleteAccountHint")}</p>

          {deletionRequest ? (
            <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {t("settings.deletionPending", {
                date: formatDate(deletionRequest.requestedAt),
              })}
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              <Label htmlFor="confirm-delete">{t("settings.deleteAccountConfirm")}</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  placeholder={confirmWord}
                  className="w-full sm:max-w-48"
                />
                <Button
                  variant="destructive"
                  onClick={() => requestDeletion.mutate()}
                  disabled={confirmText !== confirmWord || requestDeletion.isPending}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> {t("settings.requestDeletion")}
                </Button>
              </div>
            </div>
          )}

          <Button variant="ghost" className="mt-4" onClick={signOut}>
            <LogOut className="mr-1.5 h-4 w-4" /> {t("settings.signOut")}
          </Button>
        </section>
      </div>
    </div>
  );
}
