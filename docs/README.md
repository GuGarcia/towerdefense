# Tower Defense — Vision du jeu

## Concept

Jeu de tower defense en navigateur : le joueur contrôle une **forme géométrique (pentagone)** fixe au centre de l’aire de jeu. Des **ennemis apparaissent sur un cercle** à distance fixe (éventuellement hors écran) et **se rapprochent en ligne droite**. Le joueur **tire des munitions** pour les éliminer. **Si un ennemi touche le personnage, il perd des points de vie.** À 0 PV, la partie est perdue.

## Personnage

- **Position** : fixe au centre du board.
- **Caractéristiques** : dégâts, vie (life / maxLife), régen, vitesse d’attaque.
- **Visée** : auto-aim sur l’ennemi le plus proche.
- **Actions** : tir automatique (selon la vitesse d’attaque) ; achat d’upgrades entre les tirs.

## Gameplay

- En **tuant des ennemis**, le joueur gagne de **l’argent** et peut **améliorer ses caractéristiques** ; le coût des upgrades augmente (formule réglable via paramètres de partie).
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
