import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { useI18n } from "@/i18n";
import {
  collaborationsQuery,
  connectionsQuery,
  directoryQuery,
  feedQuery,
  meQuery,
  recommendationsQuery,
} from "@/data/queries";
import { ProfileView } from "@/components/netclub/ProfileView";
import { ProfileEditDialog } from "@/components/netclub/ProfileEditDialog";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Meu perfil — NetClub" },
      { name: "description", content: "Seu perfil profissional no NetClub." },
    ],
  }),
  loader: async ({ context: { queryClient } }) => {
    const me = await queryClient.ensureQueryData(meQuery);
    if (!me) return null;
    await Promise.all([
      queryClient.ensureQueryData(feedQuery),
      queryClient.ensureQueryData(connectionsQuery),
      queryClient.ensureQueryData(directoryQuery),
      queryClient.ensureQueryData(recommendationsQuery(me.id)),
      queryClient.ensureQueryData(collaborationsQuery(me.id)),
    ]);
    return me;
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useI18n();
  const { data: me } = useSuspenseQuery(meQuery);
  const [editing, setEditing] = useState(false);

  if (!me) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t("profile.title")}</h1>
        <Link
          to="/premium"
          className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold hover:bg-gold/15"
        >
          <Crown className="h-3.5 w-3.5" /> {t("premium.title")}
        </Link>
      </div>

      {!me.onboarded && (
        <Link
          to="/onboarding"
          className="mb-4 block rounded-xl border border-gold/35 bg-gold/10 p-3 text-xs text-gold hover:bg-gold/15"
        >
          {t("home.onboardingBody")} · {t("home.onboardingCta")}
        </Link>
      )}

      <ProfileView profile={me} me={me} onEdit={() => setEditing(true)} />

      <ProfileEditDialog open={editing} onOpenChange={setEditing} profile={me} />
    </div>
  );
}
