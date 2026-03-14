# Roadmap Déploiement — Préparer le déploiement (Dokploy)

Ce document décrit les étapes pour préparer le dépôt au déploiement avec **Dokploy** : Dockerfile, Docker Compose, et configuration côté repo. L’application est une SPA React (Bun) dans `front/`, avec build vers `dist/` et serveur de preview (Bun) sur un port configurable.

**Contexte** : aucun Dockerfile ni docker-compose n’existe aujourd’hui dans le repo. Dokploy attend une source Git avec un chemin vers un fichier Compose (ex. `./docker-compose.yml`) et construit ou utilise des images Docker.

**Référence** : [Dokploy — Docker Compose](https://docs.dokploy.com/docs/core/docker-compose), [Example](https://docs.dokploy.com/docs/core/docker-compose/example).

---

## 1 — Dockerfile (build et exécution)

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **1.1** Emplacement | Créer un `Dockerfile` à la racine du repo ou dans `front/`. Si à la racine, le `context` du build devra pointer vers `front/` (ou `.` avec COPY adaptés). | Haute |
| **1.2** Stage build | Installer Bun, copier `package.json` et `bun.lock`, lancer `bun install --frozen-lockfile`, copier le code source, exécuter `bun run build` pour produire `dist/`. | Haute |
| **1.3** Stage run | Image finale légère : soit (a) multi-stage avec uniquement `dist/` + binaire Bun + `serve.js` (ou équivalent) pour servir les statiques, soit (b) image nginx avec uniquement `dist/` copié dans `/usr/share/nginx/html`. | Haute |
| **1.4** Port | Exposer un port unique et fixe (ex. `3000` ou `5173`) et documenter lequel est utilisé pour Traefik / Domains. | Haute |
| **1.5** CMD/ENTRYPOINT | Définir la commande qui lance le serveur (Bun ou nginx) et écoute sur le port exposé. | Haute |

---

## 2 — docker-compose.yml

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **2.1** Emplacement | Fichier `docker-compose.yml` à la **racine** du repo (Dokploy : Compose path = `./docker-compose.yml`). | Haute |
| **2.2** Service app | Un service (ex. `web` ou `front`) avec `build` pointant vers le Dockerfile (context + dockerfile), sans `container_name`. | Haute |
| **2.3** Réseau | Ajouter `networks: - dokploy-network` au service et déclarer `dokploy-network: external: true` dans la section `networks`. Obligatoire pour que Traefik et Dokploy routent le trafic. | Haute |
| **2.4** Port exposé | Exposer le port du serveur (ex. `"3000"` sans mapping `host:container` si le routage se fait uniquement via Traefik). | Haute |
| **2.5** Variables d’environnement | Utiliser `env_file: [.env]` ou `environment: - VAR=${VAR}` pour les variables nécessaires au build ou au runtime (ex. `NODE_ENV=production`). Les variables sont définies dans l’UI Dokploy (onglet Environment) et écrites dans `.env` par Dokploy. | Moyenne |
| **2.6** Labels Traefik (optionnel) | Si le domaine est géré dans le compose : labels `traefik.enable=true`, `traefik.http.routers.<nom>.rule=Host(\`domaine.com\`)`, `entrypoints=websecure`, `tls.certResolver=letsencrypt`, `traefik.http.services.<nom>.loadbalancer.server.port=<port>`. Sinon, configurer le domaine via l’onglet **Domains** de Dokploy (recommandé). | Basse |

---

## 3 — .dockerignore

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **3.1** Fichier à la racine | Créer un `.dockerignore` à côté du Dockerfile pour réduire le contexte envoyé au daemon Docker et éviter d’inclure `node_modules`, `.git`, `dist/`, fichiers de dev, etc. | Haute |
| **3.2** Entrées typiques | Au minimum : `node_modules`, `.git`, `dist`, `*.log`, `.env`, `*.md` (optionnel), dossiers de tests ou de doc si non nécessaires au build. | Moyenne |

---

## 4 — Variables d’environnement et .env.example

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **4.1** .env.example | Ajouter un fichier `.env.example` à la racine (ou dans `front/`) listant les variables utiles au build ou au run (ex. `NODE_ENV=production`, `PORT=3000`), sans valeurs sensibles. À commiter ; ne pas commiter `.env` réel. | Moyenne |
| **4.2** Documentation | Indiquer dans le README ou dans ce doc quelles variables sont à renseigner dans Dokploy (onglet Environment) pour le déploiement. | Basse |

---

## 5 — Configuration Dokploy (côté UI)

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **5.1** Projet et service | Créer un projet puis un service de type **Docker Compose**, relié au dépôt Git (GitHub, etc.). | Haute |
| **5.2** Compose path | Définir le chemin du fichier Compose : `./docker-compose.yml`. Branche : en général `main` ou `master`. | Haute |
| **5.3** Domaine | Dans l’onglet **Domains**, associer un domaine (A record pointant vers le serveur) et le faire correspondre au service (port du container). Prévoir HTTPS via Let’s Encrypt (Traefik). | Haute |
| **5.4** Webhook | Activer le webhook fourni par Dokploy pour déclencher un déploiement automatique à chaque push sur la branche cible. | Moyenne |

---

## 6 — Volumes et persistance

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **6.1** Besoin persistant | L’app actuelle est une SPA sans backend ni BDD ; pas de volume obligatoire pour le fonctionnement. Si plus tard des fichiers doivent être persistés, utiliser des **named volumes** Docker (recommandé par Dokploy pour les backups) ou bind mounts `../files/...`. | Basse |

---

## 7 — Bonnes pratiques et pièges

| Point | Recommandation |
|-------|----------------|
| **Fichiers du repo** | Ne pas monter des fichiers du dépôt via des chemins relatifs dans les volumes : avec AutoDeploy, Dokploy fait un `git clone` à chaque déploiement et le contenu du répertoire est remplacé. Utiliser **Mounts** (Advanced) si des fichiers du repo doivent être utilisés en lecture. |
| **container_name** | Ne pas définir `container_name` sur les services : cela peut poser des problèmes avec les logs, métriques et la gestion des déploiements par Dokploy. |
| **Ports** | Pour un accès via Traefik uniquement, exposer le port du container (ex. `"3000"`) sans le mapper sur l’hôte ; Traefik route via le réseau `dokploy-network`. |

---

## 8 — Récapitulatif des priorités

- **Haute** : Dockerfile (build + run), docker-compose.yml (service, réseau `dokploy-network`, pas de `container_name`), .dockerignore, configuration Dokploy (Compose path, domaine).
- **Moyenne** : Variables d’environnement (env_file / environment), .env.example, webhook.
- **Basse** : Labels Traefik dans le compose (si pas d’usage de l’onglet Domains), volumes, doc des variables.

---

## 9 — Ordre de mise en œuvre suggéré

1. **.dockerignore** à la racine (ou à côté du Dockerfile).
2. **Dockerfile** : build Bun → `dist/`, puis image de run (Bun serve ou nginx) avec port fixe.
3. **docker-compose.yml** à la racine : un service, build, réseau `dokploy-network`, port exposé, pas de `container_name`.
4. **.env.example** et, si besoin, passage de variables au build via `args` ou au run via `environment` / `env_file`.
5. **Dokploy** : créer le service Docker Compose, renseigner le repo et le Compose path, configurer le domaine (Domains), tester un déploiement.
6. **Webhook** : activer pour déploiement automatique sur push.

---

*Ce document peut être utilisé comme checklist : cocher les tâches au fur et à mesure.*
