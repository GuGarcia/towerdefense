## Roadmap audit `player/src`

Ce document synthétise l’audit du dossier `player/src`, propose une roadmap d’améliorations incrémentales et prépare la migration vers un domaine `player` intégré au front.

**État actuel** : la migration est faite. Le code vit dans **`front/src/player/`** (domain, application, infrastructure). L’entrée front est `front/src/index.ts` qui importe le player. Le Makefile cible `front/`. Les points 1.1 à 1.3, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1 et 6.1 sont réalisés. Il reste 5.2 (optimisations perfs, long terme).

### 0. Cible d’architecture : `front/src/player/{Domain,Application,Infra}` ✅ (fait)

- **Objectif global**
  - Isoler le “player” comme un sous-domaine à part entière, réutilisable (jeu web, simulateur, outils d’équilibrage, éditeur de paramètres, etc.).
  - Intégrer ce sous-domaine directement dans le front sous la forme :
    - `front/src/player/Domain` : règles du jeu et entités pures (Game, Player, Enemy, Projectile, Wave, économie, GameParams, etc.).
    - `front/src/player/Application` : orchestrateurs et cas d’usage (GameRunner, services de simulation, adaptation inputs UI → domaine, logique de replay côté app).
    - `front/src/player/Infra` : intégrations concrètes (rendu Canvas/WebGL, horloge browser, persistance locale de replays, éventuellement API réseau).

- **Bénéfices attendus**
  - **Réutilisabilité** : même code de domaine pour d’autres interfaces (CLI de simu, outils internes, autre front).
  - **Testabilité** : tests concentrés sur `Domain` et `Application`, sans dépendre du front complet.
  - **Évolutivité** : possibilité de changer de techno de rendu ou de stockage sans impacter le cœur du jeu.

- **Plan de migration (high-level)**
  - Étape 1 : créer l’arborescence cible `front/src/player/{Domain,Application,Infra}` sans branchement dans l’UI.
  - Étape 2 : déplacer progressivement le **domaine pur** (`Game`, `Player`, `Enemy`, `Projectile`, `Wave*`, `GameParams`, économie) dans `Domain`, en gardant les tests existants comme filet de sécurité.
  - Étape 3 : déplacer les orchestrateurs (`GameLoop`, `GameRunner`, logique de replay “métier”) dans `Application`.
  - Étape 4 : déplacer et adapter les briques d’infra (rendu canvas, clock, IO replays) dans `Infra`.
  - Étape 5 : exposer une API front claire (`front/src/player/index.ts`) pour monter/démonter une instance de jeu depuis les composants du front.
  - Étape 6 : supprimer progressivement l’ancien dossier `player/src` une fois la migration stabilisée (tests verts, usages front migrés).

### 1. Domaine (`domain/*`)

- **1.1. Refactoriser `Game.tick` en sous-fonctions pures**
  - Extraire des fonctions internes dédiées, par exemple :
    - `applyWaveEconomy(game, frameIndex)`
    - `updateEnemiesAndStuck(game, frameIndex)`
    - `handleShootingAndProjectiles(game, frameIndex)`
    - `applyPlayerDamageAndDeath(game, frameIndex)`
  - Objectif : garder la logique identique mais réduire la taille de `tick` et rendre la lecture plus guidée.
  - Priorité : **haute** (lisibilité / maintenabilité).

- **1.2. Centraliser le scaling des vagues**
  - Aujourd’hui, la logique de scaling (via `difficultyScaling`, `wave1DifficultyFactor`) est dupliquée entre :
    - `getWaveEnemyStats`
    - `getWaveComposition`
    - `getEnemiesToSpawnThisFrame`
  - Introduire un petit util, par ex. `scaleWaveStat(gameParams, waveNumber, key, base)` dans un module partagé (`WaveScaling` ou similaire).
  - Priorité : **moyenne**.

- **1.3. Paramétrer les facteurs d’upgrade**
  - Les coefficients d’upgrade (`+15%`, `+10%`, etc.) dans `Player.applyUpgrade` sont codés en dur.
  - Les déplacer dans `GameParams.player` (ex. `damageUpgradeFactor`, `lifeUpgradeFactor`, …) afin de :
    - Faciliter le balancing sans toucher au code.
    - Permettre différents presets de difficulté.
  - Priorité : **moyenne**.

### 2. Infrastructure (`infrastructure/*`)

- **2.1. Renforcer le typage du système de replay**
  - Dans `PlayerInputRecorder` et `ReplayInputSource`, utiliser `UpgradeTypeValue` plutôt que `string` pour `upgradeType`.
  - Mettre à jour le type `GameRecording` pour refléter ce typage plus strict.
  - Ajouter un test qui valide qu’un enregistrement puis un replay reproduisent exactement l’état d’une run.
  - Priorité : **haute** (sécurité de type / fiabilité des replays).

- **2.2. Éventuelle factorisation des couleurs / thèmes** ✅ (fait)
  - Module `front/src/player/infrastructure/rendering/theme.ts` : `RenderTheme`, `NEON_THEME`. `createCanvasRenderer(canvas, getScale, theme?)` accepte un thème optionnel (défaut NEON).
  - Priorité : **basse** (cosmétique / extensibilité).

### 3. Entrée principale et UI (`index.ts`)

- **3.1. Découper la construction de l’UI**
  - Extraire des fonctions pures côté infrastructure / UI :
    - `setupReplayToolbar(toolbarEl, recorder, ...)`
    - `setupUpgradeBars(upgradeBarsEl, nPlayers, onUpgradeClick)`
    - `setupGameOverlay(canvas, onReplayClick)`
  - Objectifs :
    - Réduire la taille de `index.ts`.
    - Permettre des évolutions de l’UI sans toucher au “wiring” principal du jeu.
  - Priorité : **haute**.

- **3.2. Externaliser les styles inline**
  - Beaucoup de styles sont définis via `style.cssText` dans `index.ts`.
  - Créer une feuille de style dédiée (ex. `player.css`) et migrer les styles :
    - Boutons de vitesse (1x, 2x, 3x).
    - Toolbar de replay.
    - Overlay GAME OVER.
    - Barres d’upgrades & barre de vie.
  - Priorité : **moyenne** (UX / maintenabilité front).

### 4. Tests et qualité

- **4.1. Couvrir les nouveaux refactors**
  - Après extraction des sous-fonctions de `Game.tick`, ajouter des tests ciblés sur ces fonctions pour garantir la non-régression.
  - Ajouter un test bout-en-bout de replay :
    - Lancer une run avec quelques upgrades.
    - Exporter le recording.
    - Rejouer le recording et vérifier que le `Game` final est identique.
  - Priorité : **haute**.

- **4.2. Vérifier la cohérence HUD / domaine** ✅ (fait)
  - Tests ajoutés dans `WaveSpawner.test.ts` : cohérence `getWaveComposition` / `getWaveEnemyStats`, et `getWaveNumberAtFrame(getWaveStartFrame(n)) === n`.
  - Priorité : **basse à moyenne**.

### 5. Long terme / évolutions possibles

- **5.1. Améliorer la clock de jeu** ✅ (fait)
  - `createRafClock(onTick)` dans `FixedClock.ts` ; l’entrée player utilise `createRafClock` (rAF + pas fixe 1/60 s). Rendu synchronisé à l’écran, déterminisme conservé.
  - Objectif : meilleure intégration avec le rafraîchissement écran, et facilité d’accélération / ralenti cohérents.

- **5.2. Optimisations de performance**
  - Si le nombre d’ennemis augmente fortement :
    - Envisager des structures plus compactes (arrays plats, pooling d’objets).
    - Introduire un culling (ne pas dessiner les entités hors écran si un jour la vue n’est plus centrée).

### 6. Documentation et guidelines

- **6.1. Mettre à jour la documentation player**
  - Mettre à jour `player/GUIDELINES.md` (ou l’emplacement équivalent dans `front/src/player`) pour refléter :
    - La nouvelle architecture `Domain / Application / Infra`.
    - Les conventions de tests (où placer les tests du domaine vs. ceux du front).
    - Les règles de déterminisme (utilisation des seeds, replays, PRNG).
  - Mettre à jour au passage les autres docs de référence si nécessaire (`README`, docs front) pour pointer vers ces guidelines.

Ce document est volontairement orienté “technique / architecture”. Pour prioriser dans le temps, tu peux commencer par les tâches à priorité **haute**, puis intégrer le reste au fil du balancing et des évolutions de gameplay.
