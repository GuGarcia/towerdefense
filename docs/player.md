# Player — Technique d’enregistrement et rejeu

## Objectif

Pouvoir **enregistrer une partie** et la **rejouer à l’identique** (type Trackmania). À terme : envoyer l’enregistrement au serveur pour **vérifier l’absence de triche**. La technique doit être pensée dès le début pour rester compatible avec cette évolution.

## Principe

- Les **seules actions** du joueur sont les **achats d’upgrades**. Il n’y a pas de déplacement ni de visée manuelle.
- On n’enregistre donc **que les achats d’upgrades**, avec la **frame** à laquelle ils ont lieu.
- Le reste de la partie (spawn des ennemis, positions, dégâts, etc.) est **déterministe** : il ne dépend que de la **seed**, des **paramètres de partie** et de la **séquence d’inputs** (achats). En rejouant la même seed, les mêmes paramètres et la même séquence d’inputs, on obtient exactement la même partie.

## Données enregistrées

Pour chaque partie :

1. **Paramètres de partie** (GameParams)  
   - Seed (nombre).  
   - Tout ce qui configure la partie : durée, formules de coût, règles des vagues, stats de base des ennemis, etc.  
   - Ces paramètres définissent un “mode” ou une “config” reproductible.

2. **Séquence d’inputs**  
   - Liste d’événements du type : “à la frame N, le joueur a acheté l’upgrade X”.  
   - Exemple : `[ { frame: 120, upgradeType: "damage" }, { frame: 360, upgradeType: "attackSpeed" }, ... ]`.  
   - Les frames sans achat ne sont pas stockées (ou on peut stocker explicitement “aucun achat” si on veut un format frame-by-frame).

Avec **seed + paramètres + séquence d’inputs**, on peut recréer l’état du jeu frame par frame sans ambiguïté.

## Boucle de jeu et déterministe

- **Pas de temps fixe** : 60 updates par seconde (60 FPS). Chaque “tick” = 1 frame.
- À chaque frame, le moteur reçoit :  
  - l’**index de frame** (ou le temps en frames) ;  
  - l’**input de la frame** : soit un achat d’upgrade (type + éventuellement infos), soit “rien”.
- Toute la **logique métier** (spawn, déplacements, tirs, dégâts, régen, économie) est calculée à partir de :  
  - l’état du jeu au début de la frame ;  
  - l’index de frame ;  
  - la seed et les paramètres (pour le spawn et les formules) ;  
  - l’input de la frame (achat ou rien).  
- Aucun `Math.random()` “libre” : la randomisation (positions de spawn, etc.) utilise un **générateur déterministe** alimenté par la seed (et éventuellement le numéro de frame). Ainsi, deux exécutions avec la même seed et les mêmes inputs produisent le même état à chaque frame.

## Enregistrement (en direct)

- Pendant une partie, un **enregistreur** (côté infrastructure) écoute les actions du joueur.
- Dès qu’un **achat d’upgrade** est effectué, on enregistre : `{ frame: currentFrameIndex, upgradeType: "..." }`.
- En fin de partie, on persiste : **paramètres de partie** + **seed** + **liste d’inputs** (ordre chronologique par frame). C’est le “player” ou “replay” de la partie.

## Rejeu

- On charge les **paramètres** et la **seed** de la partie enregistrée.
- On initialise le **moteur de jeu** (domaine) avec ces paramètres et cette seed.
- On crée une **source d’input** qui, pour une frame N, retourne l’input enregistré pour N (souvent “rien”, parfois un achat).
- On lance la **même boucle** que en direct (60 FPS, tick par frame), mais au lieu de lire le clic “acheter” du joueur, on lit l’input fourni par la source d’input.
- Le domaine ne sait pas si l’input vient du clavier/souris ou du replay : il applique simplement “à cette frame, cet achat (ou aucun)”.  
Résultat : même état du jeu à chaque frame qu’en direct (à condition que la logique soit bien déterministe).

## Vérification anti-triche (plus tard)

- Le **client** envoie au serveur : **paramètres**, **seed**, **séquence d’inputs**.
- Le **serveur** rejoue la partie en local (même code de logique, même seed, même inputs) et vérifie que le résultat (score, victoire/défaite, etc.) correspond à ce que le client prétend.
- Si la logique est déterministe et que les paramètres/seed/inputs sont les seules entrées, une partie “triche” (modifiée côté client) ne pourra pas être rejouée de façon cohérente côté serveur.

## Résumé

| Élément | Rôle |
|--------|------|
| **GameParams + seed** | Définissent les règles et le hasard reproductible. |
| **Input = achats d’upgrades** | Seule entrée joueur ; enregistrée par frame. |
| **Boucle 60 FPS** | Chaque frame = même logique, même ordre de calcul. |
| **Enregistrement** | Paramètres + seed + liste (frame, upgradeType). |
| **Rejeu** | Réinjecter cette liste comme source d’input, même moteur. |
| **Anti-triche** | Rejeu côté serveur et comparaison du résultat. |

Ce document décrit la technique du “player” (enregistrement + rejeu) indépendamment de l’implémentation (langage, format de fichier). L’architecture du code (DDD, couches) est décrite dans [ARCHITECTURE.md](./ARCHITECTURE.md).
