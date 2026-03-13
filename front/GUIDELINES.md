# Player — Development guidelines

Conventions and practices for the Tower Defense player codebase. See also [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for the DDD layout.

---

## Language

- **Code and comments**: English (variable names, JSDoc, inline comments).
- **User-facing strings** (UI, errors): can stay in French if the product is French-only; otherwise prefer English or i18n.

---

## Tech stack

- **Runtime / build**: [Bun](https://bun.sh) (TypeScript runs natively; no separate `tsc` build step for execution).
- **Language**: TypeScript (`src/**/*.ts`). Strict mode in `tsconfig.json`.
- **Rendering**: Canvas 2D (no DOM/framework in the domain).

---

## Architecture (DDD)

- **Domain** (`src/player/domain/`): game rules, entities, value objects, domain services. No dependency on the browser, Canvas, or infrastructure. Receives “frame index” + “input” and returns new state.
- **Application** (`src/player/application/`): use cases, game loop, commands. Depends only on the domain.
- **Infrastructure** (`src/player/infrastructure/`): Canvas renderer, replay recording/playback, fixed clock, UI setup. Depends on domain (and optionally application).

Do not import from `infrastructure` or `application` inside `domain`. The domain must remain framework- and IO-agnostic.

---

## Determinism and replay

- Game logic is **deterministic**: same `GameParams` + seed + sequence of inputs → same game state at every frame.
- No `Math.random()` in the domain; use a **seeded RNG** (e.g. in `WaveSpawner`) so spawn and any “random” behavior are reproducible.
- **Input** for a frame is only “buy upgrade” (or nothing). All inputs are recorded by frame (typed as `UpgradeTypeValue`) for replay and future server-side verification.
- Replay: a run can be reproduced by replaying the same seed + params + inputs; tests should assert that “record then replay” yields identical state (see `Game.test.ts` replay test).

---

## Code style

- **Immutability**: domain state is updated by returning new objects (e.g. `{ ...player, life: newLife }`), not by mutating in place.
- **Value objects**: config and DTOs are read-only where possible (`readonly`, `Object.freeze` / `deepFreeze` for `GameParams`).
- **Naming**: `camelCase` for variables/functions; `PascalCase` for types/classes. Files: `PascalCase` for domain types (e.g. `GameParams.ts`), `camelCase` for scripts (e.g. `build.js`).
- **Exports**: prefer named exports; use `type` for type-only exports when relevant.

---

## Tests and quality

- **Unit tests**: next to the code, `*.test.ts`. Run with `bun test`.
- **Domain tests** (`src/player/domain/**/*.test.ts`): cover pure logic (Game, Player, Wave, UpgradeCost, etc.) with no DOM or infra. Prefer these for determinism and replay.
- **Infra/application tests**: add when needed; keep domain tests as the main safety net so refactors (e.g. UI, renderer) don’t break game rules.
- **CI**: `make ci` (or `bun run ci`) runs **typecheck** (`tsc --noEmit`), **tests** (`bun test`), and **lint** (`eslint`). All must pass before merging.
- **Lint**: ESLint 9 (flat config in `eslint.config.js`). TypeScript rules via `typescript-eslint`. Fix before committing.

---

## Adding features

1. **Domain first**: new rules, entities, or value objects go in `src/player/domain/` without touching Canvas or replay.
2. **Application**: new use cases or commands in `src/player/application/` that call the domain.
3. **Infrastructure**: new rendering or I/O in `src/player/infrastructure/`; keep logic in domain/application.
4. **Parameters**: new tunables go in `GameParams` (or a dedicated value object) so they are part of the replay payload and stay deterministic.

---

## References

- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) — DDD layers and folder structure.
- [player.md](../docs/player.md) — Replay and input recording.
- [GAME_PARAMS.md](../docs/GAME_PARAMS.md) — List of game parameters.
- [ROADMAP.md](../docs/ROADMAP.md) — Tasks and progress.

