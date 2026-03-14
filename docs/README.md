# Tower Defense — Vision du jeu

## Concept

Jeu de tower defense en navigateur : le joueur contrôle une **forme géométrique (pentagone)** fixe au centre de l’aire de jeu. Des **ennemis apparaissent sur un cercle** à distance fixe (éventuellement hors écran) et **se rapprochent en ligne droite**. Le joueur **tire des munitions** pour les éliminer. **Si un ennemi touche le personnage, il perd des points de vie.** À 0 PV, la partie est perdue.

## Personnage

- **Position** : fixe au centre du board.
- **Caractéristiques** : dégâts, vie (life / maxLife), régen, vitesse d’attaque.
- **Visée** : auto-aim sur l’ennemi le plus proche.
- **Actions** : tir automatique (selon la vitesse d’attaque) ; achat d’upgrades entre les tirs.

## Gameplay

- **Cash** (en partie) : en tuant des ennemis et en atteignant des vagues, le joueur gagne du cash et peut **acheter des upgrades** ; le coût augmente de façon exponentielle (formule réglable via paramètres).
- **Coins** (meta-progression) : en fin de run (mort ou quitter, pas si sauvegarde), le joueur gagne des coins pour améliorer les stats de départ et débloquer des upgrades (voir [ROADMAP_V7_GAMEPLAY.md](./ROADMAP_V7_GAMEPLAY.md)).
- Les ennemis arrivent par **vagues** de plus en plus difficiles.
- **Toutes les 10 vagues** : un **boss**.
- **Durée cible** d’une partie : ~10 minutes (réglable via paramètres).
- **Défaite** : lorsque le personnage atteint **0 point de vie**.

## Ennemis

Trois archétypes (stats ajustables via paramètres) :

| Archétype | Vie | Vitesse | Dégâts | Taille | Ordre de grandeur (début de partie) |
|-----------|-----|---------|--------|--------|-------------------------------------|
| **Base**  | Moyenne | Moyenne | Moyen | Moyenne | ~2 balles pour le tuer |
| **Rapide**| Faible | Rapide | Faible | Petite | ~1 balle |
| **Boss**  | Élevée | Lent | Élevé | Grande | ~5 balles |

## Esthétique

Style **minimal / neon** type **synthwave** : fond sombre, formes géométriques, traits et effets lumineux.

## Technique (résumé)

- **Rendu** : Canvas 2D.
- **Boucle** : 60 FPS fixes, logique **déterministe** frame par frame.
- **Replay** : enregistrement des **achats d’upgrades** à la frame ; **seed + paramètres de partie** pour rejouer à l’identique (voir [player.md](./player.md)).

## Public cible du document

Ce README sert de **one-pager** : une référence unique pour ce qu’on attend du jeu (game design, règles, ambiance). Les détails techniques (player, architecture, paramètres) sont dans les autres docs.

---

## Où on en est (récap)

| Périmètre | État | Référence |
|-----------|------|-----------|
| **Cœur jeu (domaine, app, infra)** | ✅ Fait — Phases 0 à 3 du [ROADMAP](./ROADMAP.md) : setup, domaine (Game, Player, Enemy, Wave, économie, replay), boucle de jeu, rendu Canvas. | [ROADMAP.md](./ROADMAP.md) |
| **Migration front** | ✅ Fait — Code player dans `front/src/player/` (domain, application, infrastructure). Makefile et entrée ciblent `front/`. | [ROADMAP_V3_AUDIT.md](./ROADMAP_V3_AUDIT.md) |
| **Menu / UI complète** | ✅ Fait — Routes (/, /custom, /play, /replay, /settings), i18n FR/EN, formulaire partie personnalisée, liste replays, partage (lien config + export). | [ROADMAP_V4_MENU.md](./ROADMAP_V4_MENU.md) |
| **Mobile** | 🟡 En cours — Viewport, safe area, zoom désactivé sur /play, barre pause, upgrades (scroll), Custom responsive, cibles 44px, overlays, typo clamp(), PWA. Jeu en portrait et paysage. Reste : Replay (tailles tap), etc. | [ROADMAP_V5_MOBILE.md](./ROADMAP_V5_MOBILE.md) |
| **Déploiement** | 🟡 En cours — Dockerfile (`front/`), `docker-compose.yml` (dokploy-network), `.dockerignore`, `.env.example`. Reste : config Dokploy (Compose path, domaine, webhook). | [ROADMAP_V6_DEPLOY.md](./ROADMAP_V6_DEPLOY.md) |
| **Gameplay / Meta-progression** | ⬜ À faire — Coins (meta) vs cash (run), gain de coins en fin de partie, difficulté %, nouveaux stats (armure, thorns, crit, vampirisme, etc.), catégories d’upgrades, formules coût exponentiel / gain linéaire. | [ROADMAP_V7_GAMEPLAY.md](./ROADMAP_V7_GAMEPLAY.md) |

**Lancer en local** : `make dev` ou `cd front && bun run dev`.
