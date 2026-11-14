import type { Profile } from "@/data/types";

/**
 * Afinidade calculada apenas com dados reais do perfil.
 * Não existe percentual "inventado": a pontuação serve só para ordenar
 * quem tem mais pontos em comum e nunca é exibida como número.
 */
export function sharedProfileItems(me: Profile, other: Profile) {
  const skills = other.skills.filter((skill) => me.skills.includes(skill));
  const interests = other.interests.filter((interest) => me.interests.includes(interest));
  const goals = other.goals.filter((goal) => me.goals.includes(goal));
  const sameArea = Boolean(me.area) && me.area === other.area;
  return { skills, interests, goals, sameArea };
}

export function affinityScore(me: Profile, other: Profile) {
  const { skills, interests, goals, sameArea } = sharedProfileItems(me, other);
  return skills.length * 3 + interests.length * 2 + goals.length + (sameArea ? 2 : 0);
}

/** Escolhe dinamicamente o perfil em destaque entre os candidatos reais. */
export function featuredCandidate(me: Profile, candidates: Profile[]): Profile | null {
  if (candidates.length === 0) return null;
  return candidates.reduce((best, current) =>
    affinityScore(me, current) > affinityScore(me, best) ? current : best,
  );
}
