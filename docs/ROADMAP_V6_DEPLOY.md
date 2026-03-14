# Roadmap Déploiement — Préparer le déploiement (Dokploy)

Ce document décrit les étapes pour préparer le dépôt au déploiement avec **Dokploy** : Dockerfile, Docker Compose, et configuration côté repo. L’application est une SPA React (Bun) dans `front/`, avec build vers `dist/` et serveur de preview (Bun) sur un port configurable.

**Contexte** : Dockerfile (dans `front/`), `docker-compose.yml` à la racine, `.dockerignore` dans `front/`, `.env.example` à la racine. Reste la configuration Dokploy (UI) et le domaine. Dokploy attend une source Git avec un chemin vers un fichier Compose (ex. `./docker-compose.yml`) et construit ou utilise des images Docker.

**Référence** : [Dokploy — Docker Compose](https://docs.dokploy.com/docs/core/docker-compose), [Example](https://docs.dokploy.com/docs/core/docker-compose/example). **Guide pas à pas** : [DEPLOY_DOKPLOY.md](./DEPLOY_DOKPLOY.md).

---

## 1 — Dockerfile (build et exécution)

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **1.1** Emplacement | `Dockerfile` dans `front/` ; le compose utilise `context: ./front`, `dockerfile: Dockerfile`. | ✅ Fait |
| **1.2** Stage build | Bun, `package.json` + `bun.lock`, `bun install --frozen-lockfile`, copie du code, `bun run build` → `dist/`. | ✅ Fait |
| **1.3** Stage run | Image `nginx:alpine` : `dist/` copié dans `/usr/share/nginx/html`, `nginx.conf` (fallback SPA, cache statiques). | ✅ Fait |
| **1.4** Port | Port `80` exposé (EXPOSE 80). À utiliser dans Dokploy Domains pour Traefik. | ✅ Fait |
| **1.5** CMD/ENTRYPOINT | `CMD ["nginx", "-g", "daemon off;"]`. | ✅ Fait |

---

## 2 — docker-compose.yml

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **2.1** Emplacement | `docker-compose.yml` à la **racine** (Dokploy : Compose path = `./docker-compose.yml`). | ✅ Fait |
| **2.2** Service app | Service `web`, `build.context: ./front`, `build.dockerfile: Dockerfile`, pas de `container_name`. | ✅ Fait |
| **2.3** Réseau | `networks: - dokploy-network` sur le service, `dokploy-network: external: true` déclaré. | ✅ Fait |
| **2.4** Port exposé | `ports: - "80"` (conteneur uniquement ; Traefik route via le réseau). | ✅ Fait |
| **2.5** Variables d’environnement | Utiliser `env_file: [.env]` ou `environment: - VAR=${VAR}` pour les variables nécessaires au build ou au runtime (ex. `NODE_ENV=production`). Les variables sont définies dans l’UI Dokploy (onglet Environment) et écrites dans `.env` par Dokploy. | Moyenne |
| **2.6** Labels Traefik (optionnel) | Si le domaine est géré dans le compose : labels `traefik.enable=true`, `traefik.http.routers.<nom>.rule=Host(\`domaine.com\`)`, `entrypoints=websecure`, `tls.certResolver=letsencrypt`, `traefik.http.services.<nom>.loadbalancer.server.port=<port>`. Sinon, configurer le domaine via l’onglet **Domains** de Dokploy (recommandé). | Basse |

---

## 3 — .dockerignore

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **3.1** Fichier à la racine | `.dockerignore` dans `front/` (à côté du Dockerfile) : `node_modules`, `dist`, `.git`, etc. | ✅ Fait |
| **3.2** Entrées typiques | `node_modules`, `dist`, `.git`, `*.log`, `.env`, tests, `docs`. | ✅ Fait |

---

## 4 — Variables d’environnement et .env.example

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **4.1** .env.example | `.env.example` à la racine : `NODE_ENV=production`. Conteneur nginx sur port 80. À commiter ; ne pas commiter `.env`. | ✅ Fait |
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
| **Ports** | Pour un accès via Traefik uniquement, exposer le port du container (ex. `"80"` pour nginx) sans le mapper sur l’hôte ; Traefik route via le réseau `dokploy-network`. |

---

## 8 — Récapitulatif des priorités

- **Côté repo (fait)** : Dockerfile (`front/`), docker-compose.yml (service `web`, réseau `dokploy-network`, port 80), nginx pour les statiques, .dockerignore (`front/`), .env.example.
- **Reste** : Configuration Dokploy (Compose path `./docker-compose.yml`, domaine, webhook).
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
