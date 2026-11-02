import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { repository } from "@/data/client";
import { AppShell } from "@/components/netclub/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const session = await repository.getSession();
    if (!session) throw redirect({ to: "/auth" });
  },
  component: AppShell,
});
