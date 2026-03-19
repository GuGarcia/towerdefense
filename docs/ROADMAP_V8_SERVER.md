# ROADMAP_V8_SERVER — Serveur de la Tower Defense

**État** : document de roadmap (non implémenté). Référence : [README.md](./README.md) — récap « Où on en est ».

## Objectif
Définir une roadmap serveur pour passer de l’actuel jeu 100% front (déterministe + replay local) à une architecture serveur en **2 phases**, en cohérence avec :
- le gameplay déterministe et les inputs/replays : `docs/ROADMAP_V7_GAMEPLAY.md`
- la séparation DDD : `docs/ARCHITECTURE.md`
- le déploiement Dokploy / Docker Swarm : `docs/DEPLOY_DOKPLOY.md`

## Décisions V8 actées
1. **2 phases**
   - **Phase 1** : plateforme backend HTTP (auth + profils + meta + persistance + replays).
   - **Phase 2** : validation des runs côté serveur (recalcul déterministe), pour des récompenses **server authoritative** (pas de confiance au front).
2. **Auth**
   - Démarrage via un **provider managé** (OAuth2/OIDC).
   - L’architecture prévoit une abstraction côté backend (switch possible vers Keycloak self-hosté ensuite).
3. **Simulation & frontière de confiance**
   - Le client sert au rendu et à l’enregistrement de son “input log” (command stream).
   - Le serveur (source de vérité) recalcule le résultat et en déduit les récompenses (coins + meta).
4. **Data**
   - **PostgreSQL + Redis**.
5. **Sécurité**
   - Anti-cheat : validation côté serveur via re-simulation déterministe (inputs => résultat).
   - Rate limiting : activé (principalement sur HTTP).

## HTTP-only : pourquoi (V8)
V8 ne vise pas le temps réel réseau. Le jeu reste déterministe côté moteur (front) pour le rendu, mais la récompense (coins) et les effets de meta sont **recalculés côté serveur**.

Avantages HTTP-only :
- Simplicité d’architecture : pas de connexions persistantes ni de scaling stateful.
- Cohérence déterministe : le serveur recalcule le résultat au moment de la soumission de run (HTTP).
- Tout le “hard” anti-triche se fait au serveur, sans dépendre d’un flux temps réel persistant.

## Glossaire réseau (pour le document)
- **Server authoritative rewards** : le serveur est source de vérité pour `coinsEarned` et donc pour la meta.
- **Simulation déterministe** : à partir de `seed` + `GameParams` initiales + `inputs` (command stream), le résultat (summary) doit être identique.
- **Input log / command stream** : liste d’inputs associée à des indices `frame` de simulation.
- **Front non fiable** : le serveur ignore les gains calculés localement et ne fait confiance qu’à sa propre re-simulation.

## Architecture cible (vue d’ensemble)
```mermaid
flowchart LR
  ClientWeb[Client Web] --> ApiGateway[API Gateway / BFF]
  ApiGateway --> AuthBridge[AuthBridge OIDC]
  ApiGateway --> ProfileService[Profile Service]
  ApiGateway --> MetaService[Meta Service]
  ApiGateway --> ReplayService[Replay Service]
  ProfileService --> Postgres[PostgreSQL]
  MetaService --> Postgres
  ReplayService --> Postgres
  ApiGateway --> Redis[Redis]
  ClientWeb --> RunService[Run Orchestrator (prepare + submit)]
  RunService --> SimulationService[Deterministic Simulation / Rewards Validation]
  RunService --> Redis
  SimulationService --> Redis
  SimulationService --> Postgres
```

## Phase 1 — Plateforme backend HTTP (foundation)

### Objectifs
1. Intégrer l’auth OIDC avec un provider managé.
2. Créer un profil joueur + rôle(s) (initialement `player` uniquement).
3. Persister la meta-progression (au minimum `coins`, stats de départ, upgrades débloquées).
4. Offrir des endpoints pour :
   - préparer une run (le serveur génère `runId`, `seed` et `GameParams` initiales)
   - soumettre une run pour validation server-side (recalcul des coins/meta)
   - (optionnel MVP) enregistrer et relire des replays (stockage côté serveur)
5. Mettre en place une base de sécurité : validation JWT, RBAC, rate limiting.

### Services (micro-services, mais pragmatiques)
La V8 vise des micro-services, mais l’objectif est d’obtenir vite un système testable et déployable. Démarrer petit, tout en gardant des boundaries claires.

1. **API Gateway / BFF**
   - Point d’entrée unique (HTTP).
   - Applique rate limiting et validation de base.
2. **AuthBridge**
   - Interprète le token OIDC (front/back).
   - Mappe l’identité du provider externe vers un `user_id` interne.
3. **ProfileService**
   - Stocke : `user_id`, `displayName` (optionnel), `roles`.
4. **MetaService**
   - Stocke : meta-progression persistée.
   - Gestion de la **concurrence** (plusieurs sessions / devices).
5. **ReplayService**
   - Stocke les replays (seed + params + inputs/achats).
6. (Optionnel en Phase 1, mais recommandé) **RateLimit**
   - Middleware partagé (par IP + par `user_id`).

### Endpoints HTTP (indicatifs)
- `GET /me` : profil + rôles + meta minimale (ou meta résumée).
- `POST /meta/coins` (ou `PATCH /me/meta`) : mise à jour atomique (souvent déclenchée par la fin de run).
- `POST /meta/unlocks` : déblocages et upgrades (selon règles métier).
- `POST /runs/prepare` : crée une run, renvoie `runId`, `seed` et `GameParams` initiales.
- `POST /runs/:runId/submit` : soumet un “recording”/input log pour recalculer `coinsEarned` et valider les gains.
- `POST /replays` : upload d’un replay (ou d’un “recording”).
- `GET /replays/:id` : lecture.
- `GET /replays?userId=...` : liste.

Remarque : V8 part du principe que le front est non fiable. Les coins/meta sont recalculés côté serveur après validation des inputs.

### Modèle de persistance (PostgreSQL + Redis)
#### PostgreSQL (schéma initial)
Tables minimales suggérées :
- `users` : identité interne (`id`), timestamps
- `user_roles` : rôle(s) par user
- `profiles` : displayName, etc.
- `meta_progression` : coins + stats de départ + difficultés déblocables
- `unlocked_upgrades` : relation user <-> upgrades débloquées
- `replays` : seed, game params version, enregistrement, summary
- `replay_inputs` : liste d’inputs (achats) par frame/tick

#### Redis (usage)
- Rate limiting (token bucket / fixed window).
- Cache court terme (ex : `GET /me`).
- Données temporaires pour runs/sessions de validation (surtout en Phase 2).

### Migrations / versioning DB
Obligatoire (tu as validé “oui”).
- Stratégie recommandée : migrations “forward-only” (avec scripts immuables).
- Versionnement applicatif : chaque release sait interpréter l’état DB courant.
- Recommandation outillage (au choix) :
  - Node/TS : Prisma Migrate / TypeORM migrations
  - ou outil “SQL-first” (Flyway, etc.)

Le document V8 devra préciser le choix réel d’outillage avant implémentation, mais la roadmap doit impérativement fixer la discipline : migrations versionnées + procédure staging/prod.

### Sécurité (Phase 1)
- Validation JWT / signature (selon provider OIDC).
- RBAC : au démarrage uniquement `player`.
- Rate limiting :
  - HTTP : par IP et/ou par `user_id`.
- TLS : déjà couvert côté Let’s Encrypt dans votre infra.

### Jalons Phase 1 (proposés)
1. **M1. Auth & profil**
   - `GET /me` fonctionne et retourne un `user_id` interne + rôle.
2. **M2. Meta persistée**
   - mise à jour atomique de `coins` et stats de départ.
3. **M3. Runs préparées**
   - `POST /runs/prepare` renvoie `runId`, `seed` et `GameParams` initiales calculées depuis la meta DB.
   - (optionnel MVP) upload/lecture d’un replay compatible avec le recording V7.
4. **M4. Observabilité minimale**
   - logs structurés, métriques HTTP (latence / erreurs), corrélation request-id.

## Phase 2 — Simulation server-side authoritative (récompenses)

### Objectifs
1. Le serveur recalcule les gains (`coinsEarned` et impacts meta) à partir d’une soumission de run.
2. Le serveur ne fait confiance à aucune information de gains venant du front.
3. Définir un flux simple HTTP : `prepare` (serveur) -> `submit` (inputs) -> validation + crédit.
4. Persister un “replay validé” (optionnel MVP, mais recommandé) pour audit et support.

### Contrat de soumission (pas de temps réel)
Format d’entrée attendu (compatible replay V7) :
- `runId`
- `inputs` : liste d’inputs `{ frame, upgradeType }`

Le serveur utilise :
- `seed` + `GameParams` initiales qu’il a générées lors de `POST /runs/prepare`
- une boucle déterministe frame par frame (comme le moteur V7) pour retrouver le résultat final.

### Anti-cheat / validation (Phase 2)
Pour empêcher la triche côté front, la validation doit être centrée sur la cohérence globale :
1. Vérifier que le `runId` appartient bien au user auth.
2. Valider la forme des inputs :
   - `frame` entier positif et borné (<= `durationFrames`)
   - `upgradeType` dans la liste autorisée
   - quantité d’inputs maximum (anti-spam / anti-abus)
3. Rejouer la simulation côté serveur :
   - ignorer tout `coinsEarned` calculé côté client
   - calculer `coinsEarned` et `summary` uniquement à partir du domaine déterministe
4. Appliquer un update DB idempotent (transaction) :
   - créditer `coins`
   - mettre à jour milestones/unlocks (ex : `bestWaveReached`, difficulté, etc.)

### Jalons Phase 2 (proposés)
1. **M5. MVP prepare + submit**
   - `prepare` crée `runId` + seed + GameParams serveur
   - `submit` recalcul coins et crédite en DB
2. **M6. Partage/validation déterministe**
   - tests : le même recording (seed + params + inputs) donne le même summary serveur
3. **M7. Replay validé côté serveur**
   - stockage “preuve” (seed + params version + inputs + summary recalculé)
4. **M8. Durcissement**
   - rate limiting, idempotence, logs d’échecs de validation, alertes de divergences

## Déploiement (Dokploy / Docker Swarm)
V8 implique de nouveaux services (au minimum backend HTTP + service de simulation/validation).
Recommandation pour structurer le dépôt (à décider à implémentation, mais la roadmap doit couvrir le “quoi”) :
- `backend/` : API + services
- image “gateway-api” (HTTP)
- image “run-simulation” (optionnelle) pour exécuter la simulation/validation en worker

### staging et prod
- Vous avez déjà un CD Dokploy pour la prod.
- Ajouter staging (comme demandé) :
  - config d’environnement (DB/Redis/allowed origins)
  - domaine ou sous-domaine dédié

### Scaling de la simulation
La validation server-side est CPU-bound :
- démarrer synchrone dans l’API (MVP) si les runs restent courts,
- sinon basculer vers un worker asynchrone (queue en Redis) pour absorber la charge.
La roadmap doit imposer la règle : un `runId` doit être validé une seule fois (idempotence) et les écritures DB doivent être cohérentes.

## Risques & mitigations
1. **Divergence de déterminisme (client vs server)**
   - Mitigation : partager le même module de domaine (`Game`, `GameParams`, `tick`) entre client et server.
2. **Charge CPU (re-simulation server-side)**
   - Mitigation : bornes sur `durationFrames`, nombre max d’inputs, tests de perf; worker asynchrone si nécessaire.
3. **Concurrence sur la meta**
   - Mitigation : transactions/updates atomiques en Postgres + verrouillage logique.
4. **Sécurité de la soumission**
   - Mitigation : validation stricte format/ownership, rate limiting, logs d’échecs de validation.

## Définition “Terminé” (par phase)
### Phase 1 : terminé si
- Auth OIDC fonctionne et retourne une identité interne.
- Les endpoints meta persistés fonctionnent en lecture/écriture.
- `POST /runs/prepare` fournit `runId`, `seed` et `GameParams` initiales serveur.
- Les replays peuvent être uploadés et relus.

### Phase 2 : terminé si
- Une soumission de run est acceptée.
- Le serveur recalcule `coinsEarned` et met à jour coins/meta côté serveur.

