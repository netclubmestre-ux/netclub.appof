import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
const paths = [
  "/",
  "/auth",
  "/reset-password",
  "/legal/terms",
  "/legal/privacy",
  "/legal/guidelines",
  "/legal/contact",
  "/onboarding",
  "/home",
  "/network",
  "/netmach",
  "/clubs",
  "/chat",
  "/notifications",
  "/profile",
  "/settings",
  "/official",
  "/premium",
  "/promote",
  "/search",
];

function matches(path: string) {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  return router.matchRoutes(path);
}

describe("App routing", () => {
  it.each(paths)("matches a page for %s instead of falling back to not found", (path) => {
    expect(matches(path).at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it.each([
    ["/members/123e4567-e89b-12d3-a456-426614174000", "/members/$id"],
    ["/clubs/marketing", "/clubs/$slug"],
    ["/chat/cv-1", "/chat/$id"],
  ])("matches %s as %s", (path, fullPath) => {
    const match = matches(path).at(-1);
    expect(match?.routeId).not.toBe(rootRouteId);
    expect(match?.fullPath).toBe(fullPath);
  });

  it("does not treat an unknown path as an app route", () => {
    expect(matches("/rota-que-nao-existe").at(-1)?.routeId).toBe(rootRouteId);
  });
});
