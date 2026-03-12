# Roadmap — Todo list

Utiliser ce fichier comme checklist : cocher les tâches au fur et à mesure (`[x]`).

L’application vit dans le dossier `**player/**` ; le code source est sous `**player/src/**`.  
**Lancer le jeu** : à la racine du projet, `make dev` (Docker + Bun) ou `cd player && bun run dev` (Bun en local).

---

## Phase 0 — Setup projet

- Initialiser le projet (Bun : `package.json`, serveur de dev `serve.js`, build `build.js`)
- Créer l’arborescence `player/src/` (domain, application, infrastructure)
- Page HTML minimale + un canvas plein écran (ou zone de jeu fixe)
- Point d’entrée JS qui affiche quelque chose dans le canvas (ex. un cercle) pour valider le pipeline
- Makefile à la racine + Docker (`make dev`, `make build`, `make preview`) — validé
- Migration TypeScript (`player/src/**/*.ts`), dev avec watch (refresh manuel)
- Tests unitaires (`bun test`), typecheck (`tsc --noEmit`), lint (ESLint), `make ci`
- `player/GUIDELINES.md` — conventions et bonnes pratiques
- Commentaires dans le code en anglais

---

## Phase 1 — Domaine (cœur métier)

### GameParams & état

- `GameParams.js` — Value Object avec seed, durée, config player initial, économie, vagues, ennemis (voir [GAME_PARAMS.md](./GAME_PARAMS.md))
- `GameState.js` — états possibles (Playing, GameOver, Victory si besoin)

### Player

- `UpgradeType.js` — constantes ou enum (damage, life, regen, attackSpeed)
- `PlayerStats.js` ou champs dans Player — life, maxLife, damage, regen, attackSpeed + niveaux d’upgrade
- `Player.js` — entité : recevoir dégâts, regen par frame, “peut tirer ?” (attackSpeed), appliquer un upgrade

### Economy (domain service)

- `UpgradeCost.js` — formule coût(upgradeType, level, params) à partir de GameParams

### Ennemis

- `EnemyArchetype.js` — base, rapide, boss (value object ou constantes)
- `Enemy.js` — entité : position, direction, PV, dégâts, taille, archétype ; avancer vers le centre, recevoir dégâts

### Projectiles

- `Projectile.js` — entité : position, direction/vitesse, dégâts, cible éventuelle ; mise à jour position

### Vagues & spawn

- `Wave.js` — numéro de vague, infos utiles (ex. boss ou pas)
- `WaveSpawner.js` — service déterministe : à partir de seed + frame + GameParams, retourne les ennemis à spawn à cette frame (positions sur le cercle, archétypes, stats)

### Agrégat Game

- `Game.js` — agrégat racine : GameParams, Player, liste Enemies, liste Projectiles, vague courante, argent, GameState
- `Game.tick(frameIndex, input)` — applique input (achat upgrade), spawn (WaveSpawner), déplacements, tirs (auto-aim ennemi le plus proche), collisions, régen, mort joueur, gains d’argent

---

## Phase 2 — Application (use cases)

- `GameLoop.ts` — reçoit (game, frameIndex, input), appelle Game.tick
- `GameRunner.ts` — getGame/setGame, input, renderer, clock ; clock → input → tick → render

---

## Phase 3 — Infrastructure

### Horloge

- `FixedClock.ts` — émet un “tick” toutes les 1/60 s (setInterval ou requestAnimationFrame + throttle)

### Rendu (Canvas 2D)

- `CanvasRenderer.ts` (ou interface + implémentation) — reçoit l’état du Game, dessine fond, pentagone au centre, ennemis, projectiles
- Style neon/synthwave — couleurs, traits, effet glow (simple) dans un module dédié si besoin (ex. `neon/`)

### Replay

- `GameRecording.ts` — structure de données : seed, GameParams, liste d’inputs (frame + upgradeType)
- `PlayerInputRecorder.ts` — en direct : quand le joueur achète un upgrade, enregistre (frame, upgradeType)
- `ReplayInputSource.ts` — pour rejeu : à partir d’un GameRecording, retourne l’input pour une frame donnée

---

## Phase 4 — Intégration & boucle de jeu

- `player/src/index.ts` — crée Game (avec GameParams par défaut), FixedClock, CanvasRenderer, source d’input (clavier/UI en direct), PlayerInputRecorder, GameRunner ; lance la boucle
- UI minimale : vie, argent, raccourcis 1–4, boutons ou raccourcis pour acheter les 4 upgrades
- Vérifier le déterminisme : écran en 4 (2 parties même seed, 2 autres seeds) — même input → quadrants 1 et 2 identiques

---

## Phase 5 — Rejeu & polish

- Écran ou mode “Replay” : charger un GameRecording, créer une partie avec les mêmes params + seed, alimenter GameRunner avec ReplayInputSource au lieu du clavier
- Export / import d’une partie enregistrée (JSON ou binaire) pour partage ou vérification future
- Ajuster balance (GAME_PARAMS) pour viser ~10 min de partie et feeling correct (2 balles base, 1 rapide, 5 boss)
- Polish visuel synthwave (couleurs, feedback visuel des tirs et dégâts)

---

## Simulation headless (équilibrage)

- Script `player/src/simulate.ts` : 3 profils (full / two / one), stats par profil, replay meilleure run chacun.
- Profils : **full** (toutes les stats), **two** (max 2 stats par run), **one** (1 seule stat par run).
- Fichier de paramètres optionnel pour modifier la partie (ex. `PARAMS=simulate-params.json`) et viser ~10 min pour les 3 profils.

## Plus tard (hors proto)

- Vérification serveur : envoi seed + params + inputs, rejeu côté serveur, comparaison résultat
- Nouveaux modes / paramètres (durée, difficulté, etc.) via GameParams
- Éventuelle transition rendu (ex. WebGL) en gardant le domaine et l’application inchangés

