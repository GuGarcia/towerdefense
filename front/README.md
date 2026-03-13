# Tower Defense — Player

Application de jeu (et plus tard replay). **TypeScript** (Bun exécute le TS nativement).

## Avec Docker (depuis la racine du projet)

```bash
make dev      # Build + watch + serveur → http://localhost:5173
make build    # Build prod → front/dist/
make preview  # Servir dist/ (après make build)
make shell    # Shell dans le conteneur (Bun) avec front/ monté
```

Nécessite uniquement Docker ; l’image utilisée est `oven/bun:latest`.

## En local (Bun installé)

```bash
bun install   # optionnel : bun-types pour l’IDE
bun run dev   # build + watch + serve dist/
bun run build
bun run preview   # sert dist/ (SERVEDIR=dist)
```

Le code source est en **TypeScript** (`src/**/*.ts`). Le build produit du JavaScript dans `dist/`.

## CI (typage, tests, lint)

À la racine du projet : `make ci` (Docker) ou dans `front/` : `bun run ci`.

- **typecheck** : `tsc --noEmit`
- **test** : `bun test` (tests unitaires dans `src/**/*.test.ts`)
- **lint** : `eslint src build.js dev.js serve.js`
