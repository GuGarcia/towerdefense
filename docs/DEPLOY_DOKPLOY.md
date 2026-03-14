# Déployer Tower Defense sur Dokploy

Ce guide décrit comment déployer l’application (SPA React servie par nginx) sur **Dokploy** via un service **Docker Compose**. Le dépôt contient déjà le `Dockerfile`, le `docker-compose.yml` et la config nginx ; il reste à configurer le projet dans l’interface Dokploy.

**Références** : [Dokploy — Docker Compose](https://docs.dokploy.com/docs/core/docker-compose), [Example](https://docs.dokploy.com/docs/core/docker-compose/example).

---

## Prérequis

- Un serveur sur lequel **Dokploy** est installé et accessible.
- Le dépôt Git (GitHub, GitLab, Gitea, etc.) contenant le code, avec au minimum :
  - `docker-compose.yml` à la racine
  - `front/Dockerfile`
  - `front/nginx.conf`
- Un **nom de domaine** (ou sous-domaine) dont l’enregistrement **A** pointe vers l’IP du serveur (pour HTTPS avec Let’s Encrypt).

---

## 1. Réseau Docker `dokploy-network`

Le `docker-compose.yml` utilise le réseau externe `dokploy-network` (requis pour que Traefik route le trafic). Ce réseau est en général **créé automatiquement** par Dokploy. Si ce n’est pas le cas (erreur au déploiement du type « network dokploy-network not found »), créez-le sur l’hôte :

```bash
docker network create dokploy-network
```

---

## 2. Créer un projet et un service Compose dans Dokploy

1. Dans Dokploy, **créez un projet** (ex. « Tower Defense ») si vous n’en avez pas.
2. Dans ce projet, **ajoutez un nouveau service**.
3. Choisissez le type **Docker Compose** (et non Stack).

---

## 3. Connecter le dépôt Git

1. Sélectionnez la **source** : GitHub, GitLab, Gitea ou autre selon votre configuration.
2. **Connectez** le dépôt (autorisations / token si besoin).
3. Choisissez le **dépôt** du projet et la **branche** à déployer (souvent `main` ou `master`).

---

## 4. Chemin du fichier Compose

Dans la configuration du service :

- **Compose path** : `./docker-compose.yml`  
  (fichier à la racine du dépôt)

Enregistrez. Dokploy utilisera ce fichier pour construire et lancer le service `web` (build depuis `front/`, image nginx sur le port 80).

---

## 5. Variables d’environnement (optionnel)

L’app actuelle n’a pas de variables obligatoires en production. Si vous en ajoutez plus tard :

- Onglet **Environment** (ou équivalent) : ajoutez les paires `KEY=VALUE`.
- Dokploy les écrit dans un `.env` utilisé au déploiement. Pour les injecter dans le conteneur, il faudra les déclarer dans le `docker-compose.yml` (section `environment` ou `env_file`).

Pour l’instant, vous pouvez laisser l’onglet Environment vide.

---

## 6. Domaine et HTTPS

1. Ouvrez l’onglet **Domains** du service.
2. **Ajoutez un domaine** (ex. `towerdefense.example.com`).
3. Indiquez le **port du conteneur** : **80** (nginx écoute sur 80).
4. Sauvegardez. Dokploy / Traefik configureront le routage et, en général, **HTTPS avec Let’s Encrypt** si le domaine pointe bien vers le serveur.

Vérifiez que l’enregistrement DNS **A** du domaine (ou sous-domaine) pointe vers l’IP du serveur avant de valider.

---

## 7. Premier déploiement

1. **Lancez le déploiement** (bouton Deploy / Build & Deploy selon l’interface).
2. Dokploy va :
   - cloner le dépôt ;
   - exécuter `docker compose build` (build de l’image depuis `front/Dockerfile`) ;
   - lancer le service avec le réseau `dokploy-network`.
3. Une fois le build terminé et le conteneur démarré, ouvrez le domaine configuré : l’app Tower Defense doit s’afficher (menu, jeu, etc.).

En cas d’échec, consultez les **logs** du service dans Dokploy pour voir les erreurs de build ou de démarrage.

---

## 8. Déploiement automatique (webhook)

Pour redéployer à chaque push sur la branche ciblée :

1. Dans la configuration du service, trouvez la section **Webhook** (ou **Deploy trigger**).
2. **Activez le webhook** et copiez l’URL fournie.
3. Dans votre hébergeur Git (GitHub, GitLab, etc.), configurez un **webhook** :
   - URL : celle fournie par Dokploy ;
   - Événement : en général **Push** sur la branche que vous déployez (ex. `main`).

À chaque push sur cette branche, Dokploy déclenchera un nouveau build et déploiement.

---

## Récapitulatif

| Étape | Valeur / action |
|-------|------------------|
| Type de service | Docker Compose |
| Compose path | `./docker-compose.yml` |
| Branche | `main` (ou votre branche de prod) |
| Port du conteneur (Domains) | **80** |
| Réseau | `dokploy-network` (déjà dans le compose) |
| Variables d’env | Aucune requise pour l’instant |

---

## Dépannage — 404

- **Domaine sur la racine** : le domaine doit pointer vers la **racine** de l’app (ex. `https://towerdefense.example.com/`), pas vers un sous-chemin (ex. `https://example.com/towerdefense/`). Avec un sous-chemin, nginx ne trouve pas les fichiers et renvoie 404.
- **Port dans Dokploy** : dans l’onglet **Domains**, le port du conteneur doit être **80** (nginx écoute sur 80).
- **Rebuild** : après une modification du dépôt ou de la config, relancer un **déploiement** pour reconstruire l’image et recopier `dist/`.
- **Logs** : en cas de 404, vérifier les **logs** du conteneur dans Dokploy pour d’éventuelles erreurs nginx au démarrage.

---

*En cas de changement de structure (Dockerfile, compose, port), adapter ce guide et le [ROADMAP_V6_DEPLOY.md](./ROADMAP_V6_DEPLOY.md) en conséquence.*
