/**
 * Enemy archetypes (constants).
 */
export const EnemyArchetype = Object.freeze({
  Base: "base",
  Rapid: "rapid",
  Boss: "boss",
} as const);

export type EnemyArchetypeValue = (typeof EnemyArchetype)[keyof typeof EnemyArchetype];
export const ARCHETYPE_KEYS = Object.values(EnemyArchetype);
