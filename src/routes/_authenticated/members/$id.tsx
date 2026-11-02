import { createFileRoute, notFound, Navigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useI18n } from "@/i18n";
import {
  collaborationsQuery,
  connectionsQuery,
  directoryQuery,
  feedQuery,
  meQuery,
  profileQuery,
  recommendationsQuery,
} from "@/data/queries";
import { ProfileView } from "@/components/netclub/ProfileView";
import { EmptyState } from "@/components/netclub/EmptyState";
import { User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/members/$id")({
  head: () => ({ meta: [{ title: "Perfil — NetClub" }] }),
  loader: async ({ context: { queryClient }, params }) => {
    const [profile] = await Promise.all([
      queryClient.ensureQueryData(profileQuery(params.id)),
      queryClient.ensureQueryData(meQuery),
    ]);
    if (!profile) throw notFound();
    await Promise.all([
      queryClient.ensureQueryData(feedQuery),
      queryClient.ensureQueryData(connectionsQuery),
      queryClient.ensureQueryData(directoryQuery),
      queryClient.ensureQueryData(recommendationsQuery(params.id)),
      queryClient.ensureQueryData(collaborationsQuery(params.id)),
    ]);
    return profile;
  },
  component: MemberPage,
});

function MemberPage() {
  const { t } = useI18n();
  const { id } = Route.useParams();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: profile } = useSuspenseQuery(profileQuery(id));

  if (!me) return null;
  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
        <EmptyState icon={User} title={t("profile.notFound")} body={t("profile.notFoundBody")} />
      </div>
    );
  }

  if (profile.id === me.id) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <ProfileView profile={profile} me={me} />
    </div>
  );
}
