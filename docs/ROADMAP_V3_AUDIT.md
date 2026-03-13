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

- **1.1. Refactoriser `Game.tick` en sous-fonctions pures** ✅ (fait)
  - Fonctions internes dans `Game.ts` : `applyWaveEconomy`, `updateEnemiesAndStuck`, `handleShootingAndProjectiles`, `applyStuckDamageAndCleanup`. `tick` orchestre ces étapes.
  - Priorité : **haute** (lisibilité / maintenabilité).

- **1.2. Centraliser le scaling des vagues** ✅ (fait)
  - Module `WaveScaling.ts` avec `scaleWaveStat(gameParams, waveNumber, key, base)`. `WaveSpawner` l’utilise pour `getWaveEnemyStats`, `getWaveComposition`, `getEnemiesToSpawnThisFrame`.
  - Priorité : **moyenne**.

- **1.3. Paramétrer les facteurs d’upgrade** ✅ (fait)
  - `GameParams.player` : champs optionnels `upgradeFactorDamage`, `upgradeFactorLife`, `upgradeFactorRegen`, `upgradeFactorAttackSpeed`, `upgradeFactorRange`. `Player.applyUpgrade` les utilise (valeurs par défaut conservées).
  - Priorité : **moyenne**.

### 2. Infrastructure (`infrastructure/*`)

- **2.1. Renforcer le typage du système de replay** ✅ (fait)
  - `GameRecording` / `RecordedInput` : `upgradeType: UpgradeTypeValue`. `PlayerInputRecorder.record` et `ReplayInputSource` typés en conséquence. Test replay dans `Game.test.ts` (même seed + mêmes inputs → état identique).
  - Priorité : **haute** (sécurité de type / fiabilité des replays).

- **2.2. Éventuelle factorisation des couleurs / thèmes** ✅ (fait)
  - Module `front/src/player/infrastructure/rendering/theme.ts` : `RenderTheme`, `NEON_THEME`. `createCanvasRenderer(canvas, getScale, theme?)` accepte un thème optionnel (défaut NEON).
  - Priorité : **basse** (cosmétique / extensibilité).

### 3. Entrée principale et UI (`index.ts`)

- **3.1. Découper la construction de l’UI** ✅ (fait)
  - `infrastructure/ui/setupReplayToolbar.ts`, `setupUpgradeBars.ts`, `setupGameOverlay.ts`. L’index appelle ces fonctions avec les callbacks ; la construction DOM est isolée.
  - Priorité : **haute**.

- **3.2. Externaliser les styles inline** ✅ (fait)
  - `front/player.css` : styles toolbar, overlay, upgrade bars, life bar. `index.html` charge `player.css`. Build/dev copient le CSS dans `dist/`.
  - Priorité : **moyenne** (UX / maintenabilité front).

### 4. Tests et qualité

- **4.1. Couvrir les nouveaux refactors** ✅ (fait)
  - Test replay dans `Game.test.ts` : « replay: same seed + same recorded inputs produce identical final state ». Les sous-fonctions de `tick` sont couvertes indirectement via les tests existants sur `tick`.
  - Priorité : **haute**.

- **4.2. Vérifier la cohérence HUD / domaine** ✅ (fait)
  - Tests ajoutés dans `WaveSpawner.test.ts` : cohérence `getWaveComposition` / `getWaveEnemyStats`, et `getWaveNumberAtFrame(getWaveStartFrame(n)) === n`.
  - Priorité : **basse à moyenne**.

### 5. Long terme / évolutions possibles

- **5.1. Améliorer la clock de jeu** ✅ (fait)
  - `createRafClock(onTick)` dans `FixedClock.ts` ; l’entrée player utilise `createRafClock` (rAF + pas fixe 1/60 s). Rendu synchronisé à l’écran, déterminisme conservé.
  - Objectif : meilleure intégration avec le rafraîchissement écran, et facilité d’accélération / ralenti cohérents.

- **5.2. Optimisations de performance** (à faire si besoin)
  - Si le nombre d’ennemis augmente fortement :
    - Envisager des structures plus compactes (arrays plats, pooling d’objets) dans `Game` / listes `enemies` et `projectiles`.
    - Introduire un culling dans `CanvasRenderer` : ne dessiner que les entités dont la bounding box intersecte le viewport (utile si la vue n’est plus toujours centrée).
  - Pour l’instant le modèle (copies d’objets, pas de pool) reste adapté au scale actuel.

### 6. Documentation et guidelines

- **6.1. Mettre à jour la documentation player** ✅ (fait)
  - `front/GUIDELINES.md` : chemins `src/player/domain`, `application`, `infrastructure` ; conventions de tests (domaine vs infra) ; déterminisme et replay (`UpgradeTypeValue`, test replay). README mis à jour pour `front/`.

Ce document est volontairement orienté “technique / architecture”. Pour prioriser dans le temps, tu peux commencer par les tâches à priorité **haute**, puis intégrer le reste au fil du balancing et des évolutions de gameplay.
