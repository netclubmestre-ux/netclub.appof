import { createContext, useContext, type ReactNode } from "react";
import { repository as defaultRepository } from "./client";
import type { NetclubRepository } from "./repository";

const RepositoryContext = createContext<NetclubRepository | null>(null);

export function DataProvider({
  children,
  repository = defaultRepository,
}: {
  children: ReactNode;
  repository?: NetclubRepository;
}) {
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>;
}

export function useRepository(): NetclubRepository {
  const repo = useContext(RepositoryContext);
  if (!repo) throw new Error("useRepository precisa estar dentro de <DataProvider>");
  return repo;
}

export function useDataMode() {
  const repo = useRepository();
  return { isDemo: repo.isDemo, source: repo.source };
}
