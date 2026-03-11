# Architecture DDD (Domain-Driven Design)

Ce document décrit l’organisation du code pour garder le **domaine** indépendant du rendu et de l’infrastructure, et permettre une transition future (ex. autre moteur de rendu) sans refondre la logique métier.

## Principe

- **Domaine** : règles du jeu, entités, value objects, services métier. Aucune dépendance au navigateur ni au rendu.
- **Application** : orchestration, boucle de jeu, use cases (ex. “tick à la frame N avec tel input”).
- **Infrastructure** : Canvas 2D, enregistrement/rejeu, horloge 60 FPS.

Le **domaine** ne connaît pas Canvas, le replay ou le temps réel ; il reçoit un “numéro de frame” et des “inputs” et produit un nouvel état.

## Structure des dossiers (cible)

```
src/
├── domain/                    # Cœur métier, zéro dépendance technique
│   ├── game/
│   │   ├── Game.js            # Agrégat racine : état global de la partie
│   │   ├── GameParams.js      # Value Object : seed, durée, config vagues, etc.
│   │   └── GameState.js       # État : Playing, GameOver, Victory…
│   ├── player/
│   │   ├── Player.js          # Entité : life, maxLife, damage, regen, attackSpeed
│   │   ├── PlayerStats.js     # Value Object des caractéristiques
│   │   └── UpgradeType.js     # Type d’upgrade (damage, life, regen, attackSpeed)
│   ├── enemy/
│   │   ├── Enemy.js           # Entité : position, PV, archétype, etc.
│   │   └── EnemyArchetype.js  # Value Object : base, rapide, boss
│   ├── wave/
│   │   ├── Wave.js            # Vague en cours / plan de spawn
│   │   └── WaveSpawner.js     # Domain Service : spawn déterministe (seed + params)
│   ├── projectile/
│   │   └── Projectile.js      # Entité : position, direction, dégâts
│   └── economy/
│       └── UpgradeCost.js     # Domain Service : coût(upgradeType, level, params)
│
├── application/               # Use cases, orchestration
│   ├── GameLoop.js            # Tick(frameIndex, input) → met à jour le Game
│   ├── commands/
│   │   └── BuyUpgradeCommand.js
│   └── services/
│       └── GameRunner.js      # Lance la boucle, injecte dépendances
│
├── infrastructure/            # Détails techniques
│   ├── rendering/
│   │   ├── CanvasRenderer.js  # Implémente le rendu à partir de l’état du Game
│   │   └── neon/              # Styles synthwave (couleurs, glow)
│   ├── replay/
│   │   ├── PlayerInputRecorder.js
│   │   ├── ReplayInputSource.js
│   │   └── GameRecording.js   # Structure : seed + params + inputs par frame
│   └── clock/
│       └── FixedClock.js      # Émet un tick à 60 FPS
│
└── index.js                   # Point d’entrée : crée Game, Renderer, Clock, lance
```

## Flux

1. **Clock** (infra) déclenche un tick toutes les 1/60 s.
2. **GameRunner** (application) reçoit le tick, récupère l’**input** de la frame (clavier/UI ou ReplayInputSource).
3. **GameLoop** appelle `Game.tick(frameIndex, input)`.
4. **Game** (domaine) met à jour son état : applique l’input (achat éventuel), spawn (WaveSpawner), déplacements, tirs, collisions, régen, mort.
5. **CanvasRenderer** (infra) lit l’état du **Game** et dessine (pentagone, ennemis, projectiles, UI). Aucune logique métier ici.

## Dépendances

- **Domain** : ne dépend de rien d’autre.
- **Application** : dépend uniquement du domain.
- **Infrastructure** : dépend du domain (pour lire l’état) et éventuellement de l’application (GameRunner). Le rendu implémente une interface “Renderer” pour pouvoir remplacer Canvas par WebGL plus tard sans toucher au domaine ni aux use cases.

## Replay

L’**input** à chaque frame est soit fourni par le joueur (UI), soit par le **ReplayInputSource** (liste d’achats par frame). Le domaine ne fait pas la différence ; il applique simplement l’input. Voir [player.md](./player.md).
