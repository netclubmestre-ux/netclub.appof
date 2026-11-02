import { describe, expect, it } from "vitest";
import { ptBR } from "@/i18n/locales/pt-BR";
import { en } from "@/i18n/locales/en";
import { es } from "@/i18n/locales/es";
import { DevRepository } from "@/data/dev-repository";

describe("i18n", () => {
  const keys = Object.keys(ptBR).sort();

  it.each([
    ["en", en],
    ["es", es],
  ])("%s has exactly the same keys as pt-BR", (_language, dictionary) => {
    expect(Object.keys(dictionary).sort()).toEqual(keys);
  });

  it.each([
    ["pt-BR", ptBR],
    ["en", en],
    ["es", es],
  ])("%s has no empty translations", (_language, dictionary) => {
    const empty = Object.entries(dictionary).filter(([, value]) => !String(value).trim());
    expect(empty).toEqual([]);
  });
});

describe("DevRepository", () => {
  it("starts with the demo session and a full profile", async () => {
    const repository = new DevRepository();
    expect(await repository.getSession()).toBe("u-ana");
    const me = await repository.getCurrentProfile();
    expect(me?.fullName).toBe("Ana Ribeiro");
    expect(me?.onboarded).toBe(true);
  });

  it("creates a post and lists it in the feed", async () => {
    const repository = new DevRepository();
    const before = await repository.getFeed();
    await repository.createPost("Publicação criada no teste");
    const after = await repository.getFeed();
    expect(after.length).toBe(before.length + 1);
    expect(after.some((post) => post.content === "Publicação criada no teste")).toBe(true);
  });

  it("toggles likes without duplicating the user", async () => {
    const repository = new DevRepository();
    const post = (await repository.getFeed())[0]!;
    const wasLiked = post.likedBy.includes("u-ana");
    await repository.toggleLike(post.id);
    const updated = (await repository.getFeed()).find((item) => item.id === post.id)!;
    expect(updated.likedBy.includes("u-ana")).toBe(!wasLiked);
    await repository.toggleLike(post.id);
    const restored = (await repository.getFeed()).find((item) => item.id === post.id)!;
    expect(restored.likedBy.includes("u-ana")).toBe(wasLiked);
  });

  it("requires Premium to save a search", async () => {
    const repository = new DevRepository();
    await expect(
      repository.saveSearch({
        name: "Teste",
        skills: ["marketing"],
        goals: ["clients"],
        experience: "any",
      }),
    ).rejects.toMatchObject({ code: "PREMIUM_REQUIRED" });
  });

  it("never simulates a paid promotion", async () => {
    const repository = new DevRepository();
    const before = await repository.listPromotions();
    await expect(
      repository.createPromotion({ targetType: "post", targetId: "p-1", budget: 50, days: 7 }),
    ).rejects.toMatchObject({ code: "PAYMENTS_UNAVAILABLE" });
    expect(await repository.listPromotions()).toEqual(before);
  });

  it("keeps market quotes and news empty without a provider", async () => {
    const repository = new DevRepository();
    expect(await repository.getQuotes()).toEqual([]);
    expect(await repository.getNews()).toEqual([]);
  });

  it("signs up a non-onboarded profile and completes onboarding", async () => {
    const repository = new DevRepository();
    const id = await repository.signUpDemo("Pessoa de Teste");
    const created = await repository.getCurrentProfile();
    expect(created?.id).toBe(id);
    expect(created?.onboarded).toBe(false);

    await repository.completeOnboarding({
      fullName: "Pessoa de Teste",
      username: "pessoa.teste",
      headline: "Designer",
      area: "Design",
      bio: "Bio de teste",
      location: "São Paulo, BR",
      experience: "intermediate",
      skills: ["design"],
      interests: ["ai"],
      goals: ["clients"],
      lookingFor: "Projetos",
      offering: "Design",
    });

    const onboarded = await repository.getCurrentProfile();
    expect(onboarded?.onboarded).toBe(true);
    expect(onboarded?.username).toBe("pessoa.teste");
  });
});
