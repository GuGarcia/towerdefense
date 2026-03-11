# Paramètres de partie (GameParams)

Ce document liste les **paramètres configurables** d’une partie. Ils servent à :

- **Tester** différentes configs (durée, difficulté, économie).
- **Reproduire** une partie : même seed + mêmes paramètres = même déroulé (avec les mêmes inputs).
- **Évoluer** plus tard : nouveaux modes, events, etc., sans casser le replay.

Tous ces paramètres font partie du **GameParams** (Value Object du domaine) et sont **sauvegardés avec l’enregistrement** (player) pour pouvoir rejouer ou vérifier une partie.

---

## Identité et hasard

| Paramètre | Rôle |
|-----------|------|
| **seed** | Entier utilisé pour initialiser le générateur déterministe. Spawn des ennemis (position sur le cercle, ordre des vagues), tout aléatoire reproductible en dépend. |

---

## Durée et fin de partie

| Paramètre | Rôle |
|-----------|------|
| **durationMinutes** (ou **durationFrames**) | Durée cible d’une partie (~10 min par défaut). Peut définir un nombre max de frames (ex. 60 × 60 × 10 = 36 000 frames pour 10 min à 60 FPS). Optionnel si on préfère “jusqu’à défaite ou victoire”. |
| **victoryCondition** | Optionnel : victoire après X vagues ou après X minutes. Pour le proto, on peut ne pas avoir de “victoire”, seulement défaite à 0 PV. |

---

## Personnage (valeurs initiales)

| Paramètre | Rôle |
|-----------|------|
| **player.initialLife** | Points de vie au démarrage. |
| **player.initialMaxLife** | Vie max initiale. |
| **player.initialDamage** | Dégâts par projectile. |
| **player.initialRegen** | Régénération par frame (ou par seconde, à définir). |
| **player.initialAttackSpeed** | Délai entre deux tirs (en frames ou en “tirs par seconde”). |

---

## Économie et upgrades

| Paramètre | Rôle |
|-----------|------|
| **economy.upgradeCostBase** | Coût de base pour la formule (par type d’upgrade ou global). |
| **economy.upgradeCostFactor** | Facteur d’augmentation par niveau (ex. coût = base × factor^level). |
| **economy.currencyPerKill** | Argent gagné par ennemi tué (éventuellement par archétype : base, rapide, boss). |

Les **niveaux** d’upgrade (damage, life, regen, attackSpeed) sont gérés dans l’état du **Player** ; les paramètres définissent seulement la **formule de coût** et les **gains**.

---

## Vagues et spawn

| Paramètre | Rôle |
|-----------|------|
| **wave.spawnRadius** | Rayon du cercle de spawn (distance fixe depuis le centre). Peut être hors écran. |
| **wave.baseIntervalFrames** | Délai (en frames) entre le début de deux vagues, ou nombre de frames avant la première vague. |
| **wave.spreadSpawnOverFrames** | Étaler le spawn de la vague sur ce nombre de frames (0 = tous les ennemis au début de la vague). Ex. 60 = spawn progressif sur 1 seconde. |
| **wave.bossEveryNWaves** | Un boss tous les N vagues (ex. 10). |
| **wave.difficultyScaling** | Facteur qui augmente la difficulté (vie, nombre, dégâts des ennemis) à chaque vague. Peut être un objet (vieFactor, countFactor, etc.). |

---

## Ennemis (stats de base par archétype)

Pour chaque archétype (**base**, **rapide**, **boss**), on définit des stats “de référence” (souvent pour la vague 1), puis le scaling des vagues s’applique.

| Paramètre (exemple par archétype) | Rôle |
|-----------------------------------|------|
| **enemies.base.life** | PV de l’ennemi de base (début de partie). |
| **enemies.base.speed** | Vitesse de déplacement (unités par frame). |
| **enemies.base.damage** | Dégâts infligés au joueur au contact. |
| **enemies.base.size** | Rayon ou échelle pour le rendu et les collisions. |
| **enemies.rapid.*** | Idem pour le rapide. |
| **enemies.boss.*** | Idem pour le boss. |

On peut ajouter :

- **enemies.base.countPerWave** (ou une formule) : nombre d’ennemis de cet archétype par vague.
- **enemies.spawnAngleSpread** : si le spawn sur le cercle utilise des angles, éventuellement un spread ou une règle (ex. répartition déterministe à partir de la seed).

---

## Rendu (optionnel dans GameParams)

Les paramètres **visuels** (couleurs, taille d’écran) peuvent rester hors GameParams si ils n’influencent pas la logique. Si on veut que le “replay” affiche exactement la même chose, on peut inclure :

- **render.circleRadius** : rayon du cercle de spawn (pour le dessin), si différent du rayon logique.
- (Optionnel) thème ou palette (neon, couleurs) — plutôt côté config UI.

Pour le **déterministe**, seuls comptent les paramètres qui influencent **spawn, dégâts, vie, économie, vagues**. Le reste peut être dans un fichier de config séparé.

---

## Résumé

- **seed** + **GameParams** (durée, perso initial, économie, vagues, ennemis) définissent une **partie reproductible**.
- Les **inputs** (achats d’upgrades par frame) sont la seule entrée joueur ; avec seed + params, ils suffisent pour **rejouer** et, plus tard, **vérifier** une partie côté serveur.
- Toute évolution (nouveaux ennemis, nouveaux upgrades, events) peut s’ajouter dans **GameParams** tant que la logique reste déterministe à partir de ces valeurs.
