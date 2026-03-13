## Roadmap audit `player/src`

Ce document synthétise l’audit du dossier `player/src` et propose une roadmap d’améliorations incrémentales.

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

- **2.2. Éventuelle factorisation des couleurs / thèmes**
  - `CanvasRenderer` contient une palette NEON inline via l’objet `NEON`.
  - Si plusieurs thèmes sont envisagés, extraire ce genre de configuration dans un module ou une factory (ex. `createCanvasRenderer(canvas, getScale, theme)`).
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

- **4.2. Vérifier la cohérence HUD / domaine**
  - Ajouter quelques tests (ou snapshots visuels si besoin plus tard) pour s’assurer que :
    - Le HUD de vague (progrès, “Prochaine vague”) reflète bien `WaveSpawner`.
    - Les stats “Ennemis (vague X)” restent cohérentes lors de changements de `GameParams`.
  - Priorité : **basse à moyenne**.

### 5. Long terme / évolutions possibles

- **5.1. Améliorer la clock de jeu**
  - Étudier une clock basée sur `requestAnimationFrame` ou un système de pas de temps paramétrable (vitesse de simulation ≠ FPS d’affichage).
  - Objectif : meilleure intégration avec le rafraîchissement écran, et facilité d’accélération / ralenti cohérents.

- **5.2. Optimisations de performance**
  - Si le nombre d’ennemis augmente fortement :
    - Envisager des structures plus compactes (arrays plats, pooling d’objets).
    - Introduire un culling (ne pas dessiner les entités hors écran si un jour la vue n’est plus centrée).

Ce document est volontairement orienté “technique / architecture”. Pour prioriser dans le temps, tu peux commencer par les tâches à priorité **haute**, puis intégrer le reste au fil du balancing et des évolutions de gameplay.

