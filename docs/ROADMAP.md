# Roadmap — Todo list

Utiliser ce fichier comme checklist : cocher les tâches au fur et à mesure (`[x]`).

L’application vit dans le dossier **`player/`** ; le code source est sous **`player/src/`**.  
**Lancer le jeu** : à la racine du projet, `make dev` (Docker + Bun) ou `cd player && bun run dev` (Bun en local).

---

## Phase 0 — Setup projet

- [x] Initialiser le projet (Bun : `package.json`, serveur de dev `serve.js`, build `build.js`)
- [x] Créer l’arborescence `player/src/` (domain, application, infrastructure)
- [x] Page HTML minimale + un canvas plein écran (ou zone de jeu fixe)
- [x] Point d’entrée JS qui affiche quelque chose dans le canvas (ex. un cercle) pour valider le pipeline
- [x] Makefile à la racine + Docker (`make dev`, `make build`, `make preview`) — validé
- [x] Migration TypeScript (`player/src/**/*.ts`), dev avec watch (refresh manuel)
- [x] Tests unitaires (`bun test`), typecheck (`tsc --noEmit`), lint (ESLint), `make ci`
- [x] `player/GUIDELINES.md` — conventions et bonnes pratiques
- [x] Commentaires dans le code en anglais

---

## Phase 1 — Domaine (cœur métier)

### GameParams & état

- [x] `GameParams.js` — Value Object avec seed, durée, config player initial, économie, vagues, ennemis (voir [GAME_PARAMS.md](./GAME_PARAMS.md))
- [x] `GameState.js` — états possibles (Playing, GameOver, Victory si besoin)

### Player

- [x] `UpgradeType.js` — constantes ou enum (damage, life, regen, attackSpeed)
- [x] `PlayerStats.js` ou champs dans Player — life, maxLife, damage, regen, attackSpeed + niveaux d’upgrade
- [x] `Player.js` — entité : recevoir dégâts, regen par frame, “peut tirer ?” (attackSpeed), appliquer un upgrade

### Economy (domain service)

- [x] `UpgradeCost.js` — formule coût(upgradeType, level, params) à partir de GameParams

### Ennemis

- [x] `EnemyArchetype.js` — base, rapide, boss (value object ou constantes)
- [x] `Enemy.js` — entité : position, direction, PV, dégâts, taille, archétype ; avancer vers le centre, recevoir dégâts

### Projectiles

- [x] `Projectile.js` — entité : position, direction/vitesse, dégâts, cible éventuelle ; mise à jour position

### Vagues & spawn

- [x] `Wave.js` — numéro de vague, infos utiles (ex. boss ou pas)
- [x] `WaveSpawner.js` — service déterministe : à partir de seed + frame + GameParams, retourne les ennemis à spawn à cette frame (positions sur le cercle, archétypes, stats)

### Agrégat Game

- [x] `Game.js` — agrégat racine : GameParams, Player, liste Enemies, liste Projectiles, vague courante, argent, GameState
- [x] `Game.tick(frameIndex, input)` — applique input (achat upgrade), spawn (WaveSpawner), déplacements, tirs (auto-aim ennemi le plus proche), collisions, régen, mort joueur, gains d’argent

---

## Phase 2 — Application (use cases)

- [ ] `GameLoop.js` — reçoit (frameIndex, input), appelle `Game.tick(frameIndex, input)`
- [ ] `BuyUpgradeCommand.js` — (optionnel) encapsule l’achat d’un upgrade si tu veux une couche commande explicite
- [ ] `GameRunner.js` — reçoit les dépendances (Game, source d’input, renderer, clock), connecte clock → récupérer input → GameLoop.tick → render

---

## Phase 3 — Infrastructure

### Horloge

- [ ] `FixedClock.js` — émet un “tick” toutes les 1/60 s (setInterval ou requestAnimationFrame + throttle)

### Rendu (Canvas 2D)

- [ ] `CanvasRenderer.js` (ou interface + implémentation) — reçoit l’état du Game, dessine fond, pentagone au centre, ennemis, projectiles
- [ ] Style neon/synthwave — couleurs, traits, effet glow (simple) dans un module dédié si besoin (ex. `neon/`)

### Replay

- [ ] `GameRecording.js` — structure de données : seed, GameParams, liste d’inputs (frame + upgradeType)
- [ ] `PlayerInputRecorder.js` — en direct : quand le joueur achète un upgrade, enregistre (frame, upgradeType)
- [ ] `ReplayInputSource.js` — pour rejeu : à partir d’un GameRecording, retourne l’input pour une frame donnée

---

## Phase 4 — Intégration & boucle de jeu

- [ ] `player/src/index.ts` — crée Game (avec GameParams par défaut), FixedClock, CanvasRenderer, source d’input (clavier/UI en direct), PlayerInputRecorder, GameRunner ; lance la boucle
- [ ] UI minimale : affichage vie, argent, boutons ou raccourcis pour acheter les 4 upgrades
- [ ] Vérifier que la partie est déterministe (même seed + mêmes inputs → même déroulé)

---

## Phase 5 — Rejeu & polish

- [ ] Écran ou mode “Replay” : charger un GameRecording, créer une partie avec les mêmes params + seed, alimenter GameRunner avec ReplayInputSource au lieu du clavier
- [ ] Export / import d’une partie enregistrée (JSON ou binaire) pour partage ou vérification future
- [ ] Ajuster balance (GAME_PARAMS) pour viser ~10 min de partie et feeling correct (2 balles base, 1 rapide, 5 boss)
- [ ] Polish visuel synthwave (couleurs, feedback visuel des tirs et dégâts)

---

## Plus tard (hors proto)

- [ ] Vérification serveur : envoi seed + params + inputs, rejeu côté serveur, comparaison résultat
- [ ] Nouveaux modes / paramètres (durée, difficulté, etc.) via GameParams
- [ ] Éventuelle transition rendu (ex. WebGL) en gardant le domaine et l’application inchangés
