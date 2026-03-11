# Tower Defense — Player

Application de jeu (et plus tard replay).

## Avec Docker (depuis la racine du projet)

```bash
make dev      # Serveur de dev → http://localhost:5173
make build    # Build prod → player/dist/
make preview  # Servir les fichiers (même port)
make shell    # Shell dans le conteneur (Bun) avec player/ monté
```

Nécessite uniquement Docker ; l’image utilisée est `oven/bun:latest`.

## En local (Bun installé)

```bash
bun run dev
bun run build
bun run preview
```

Aucune dépendance npm : le serveur de dev et le build sont assurés par des scripts Bun (`serve.js`, `build.js`).
