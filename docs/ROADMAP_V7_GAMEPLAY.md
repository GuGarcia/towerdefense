# Roadmap Gameplay — Meta-progression, upgrades et difficulté

Ce document décrit les choix de design pour le gameplay : monnaies (cash / coins), meta-progression, nouveaux stats et upgrades, difficulté, et règles à respecter (déterministe, pas de capacités à cooldown).

**Contexte** : le jeu est un tower defense où le joueur (pentagone au centre) tire automatiquement sur les ennemis. Les seules actions en partie sont **l’achat d’upgrades**. Tout doit rester **déterministe** (seed + GameParams + inputs → même résultat).

**Références** : [GAME_PARAMS.md](./GAME_PARAMS.md), [player.md](./player.md), [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 1 — Monnaies

| Nom   | Contexte      | Rôle |
|-------|----------------|------|
| **Cash** | Pendant la partie | Monnaie de run : achats d’upgrades en jeu. Gagné par kills (base, rapid, boss) et bonus de vague. Réinitialisé à chaque nouvelle partie. |
| **Coins** | Meta-progression | Monnaie persistante (localStorage). Gagnée à la **fin** de la run (mort ou quitter). Permet d’améliorer les stats de départ et de débloquer des upgrades. |

### 1.1 Gain de coins en fin de run

- **Quand on crédite** : à la **mort** (Game Over) ou quand on **quitte** la partie. Si le joueur **sauvegarde** la partie (replay), il **ne reçoit pas** les gains de coins.
- **Calcul pendant la run** : une variable de run s’incrémente :
  - à **chaque vague atteinte** : + (coin/wave) × (% coin/wave), avec coin/wave et % coin/wave issus des stats (meta + upgrades de run) ;
  - à **chaque boss tué** : + coin/boss.
- **En fin de partie** (mort ou quitter) : ce solde est ajouté au total **coins** de la meta-progression, puis persisté (localStorage).

Valeurs de départ (à équilibrer) : **1 coin/vague**, **1 coin/boss**, **100 %** pour le multiplicateur coin/vague. Ces stats sont améliorables en meta et en run (comme les autres).

---

## 2 — Difficulté %

- **Choix débloquable** (meta) : 50 % = facile, 100 % = normal, 150 % = difficile, etc. (valeurs à équilibrer).
- **Effet** : le multiplicateur de difficulté s’applique aux stats des ennemis (vie, dégâts, vitesse, nombre de spawn, etc.). Une **contrepartie** possible : plus de coins ou de cash quand la difficulté est plus haute.
- **Option ultérieure** : upgrade débloquable permettant d’**augmenter la difficulté en cours de run** (avec contrepartie).
- Le **multiplicateur de difficulté** fait partie des **GameParams** et est inclus dans l’enregistrement de partie (replay) pour garder le déterministe.

---

## 3 — Formules de coût et de gain

### 3.1 Coût des upgrades (run et meta)

- **Formule** : `cost(level) = base × factor^level`, avec **factor = 1.1** (à mettre dans les paramètres, ex. GameParams ou config meta).
- S’applique en **run** (coût cash par niveau d’upgrade) et en **meta** (coût coins par niveau d’amélioration de stat de départ ou de déblocage).

### 3.2 Gain (effet des upgrades)

- **Linéaire** : chaque niveau ajoute un **delta fixe** (pas de pourcentage sur le delta).
- Un **pas (step)** est défini **par upgrade** : ex. dégâts +1 par niveau, réduction dégâts +0,01 par niveau, etc. Les pas sont dans la config (GameParams / définitions d’upgrades), sans valeur en dur type 0,01 partout.

### 3.3 Limites sur les pourcentages

- Toute **réduction en %** (ex. réduction coût cash, réduction dégâts reçus) doit être **plafonnée** (ex. 99 % max) pour éviter 100 % et de casser le jeu.
- S’applique à tous les stats en % (réduction prix, armure %, etc.).

---

## 4 — Stats et upgrades

### 4.1 Noms et catégories

**UI** : La barre d'upgrades en bas d'écran (actuellement peu utilisable) sera retravaillée avec l'introduction des catégories : organisation par onglets ou sections (Attack / Defense / Economy / Utility), lisibilité et cibles tactiles.

Les upgrades sont répartis en **4 catégories** pour l’UI (pas de limite du nombre d’upgrades par catégorie en run) :

| Catégorie | Rôle |
|-----------|------|
| **Attack** | Dégâts, critique, multi-tir, range damage %, etc. |
| **Defense** | Vie, armure, régen, vampirisme, thorns, etc. |
| **Economy** | Cash %, coin/wave, % coin/wave, coin/boss, réduction coût cash, etc. |
| **Utility** | Portée, vitesse d’attaque, etc. |

Chaque upgrade est décrit par un **UpgradeDef** (id, catégorie, coût, pas de gain, formules, etc.).

### 4.2 Liste des stats à prévoir

À intégrer dans le domaine (Player / GameParams) et dans les définitions d’upgrades (run + meta selon le cas).

| Stat | Catégorie | Description | Note |
|------|-----------|-------------|------|
| **Armure %** | Defense | Réduction des dégâts reçus en %. Appliquée **avant** l’armure fixe. | Ordre : % puis fixe (avantage joueur). |
| **Armure fixe** | Defense | Réduction fixe des dégâts reçus après le %. | |
| **Cash %** | Economy | Bonus % sur tous les gains de cash (kills + bonus de vague). | |
| **Coin/wave** | Economy | Coins de base ajoutés par vague atteinte (avant %). | Début à 1, incrément 1. |
| **% coin/wave** | Economy | Multiplicateur sur le gain coin/vague (ex. 100 % = ×1). | Début 100 %, incrément 1 par 1 (100 %, 101 %, 102 %…). |
| **Vampirisme %** | Defense | Soin en % des dégâts infligés (ou par kill). | |
| **Thorns** | Defense | Dégâts renvoyés à l’ennemi quand il inflige des dégâts au joueur (à chaque attaque de contact). | **Valeur fixe** + **% des dégâts reçus** (les deux). |
| **Difficulté %** | — | Multiplicateur sur la difficulté (vie, dégâts, vitesse, spawn ennemis). Avec contrepartie (ex. + coins/cash). | Partie des GameParams ; déblocable en meta. |
| **Coin/boss** | Economy | Coins ajoutés par boss tué. | Début à 1, incrément 1. |
| **Réduction coût cash %** | Economy | Réduction du coût en **cash** des upgrades en run. | En partie uniquement ; début 0 %, pas +0,01 % ; plafond ex. 99 %. |
| **Réduction coût coins %** | Economy | Réduction du coût en **coins** des achats en meta. | Meta uniquement ; même principe de pas et plafond. |
| **Chance multi-tir** | Attack | Probabilité de tirer plusieurs projectiles (ex. double tir). | Déterministe : utiliser la seed + frame. |
| **Crit chance %** | Attack | Probabilité qu’un tir soit critique. | |
| **Crit damage %** | Attack | Multiplicateur de dégâts quand critique (ex. 150 % = ×1,5). | |
| **Range damage %** | Attack | Plus l’impact est loin, plus les dégâts augmentent. Formule : `damage × (1 + K × distance)`, **K** petit (ex. 0,00001 au départ). Ex. K = 0,001, distance 300, base 10 → 10 × (1 + 0,3) = 13. | Calcul au moment du hit. |

*(Les stats déjà présentes — life, damage, regen, attackSpeed, range — restent ; elles peuvent être enrichies par ces nouveaux effets.)*

### 4.3 Ordre des dégâts reçus (armure)

1. Dégâts bruts de l’ennemi.
2. Application **armure %** (réduction en %).
3. Application **armure fixe** (soustraction).
4. Le résultat est les dégâts effectivement infligés au joueur (min 0 ou 1 selon design).

---

## 5 — Meta-progression

- **Coins** : gagnés en fin de run (mort ou quitter, pas si sauvegarde), comme en §1.
- **Dépenses coins** :
  - **Améliorer les stats de départ** du personnage (ex. +dégâts de base, +vie max initiale). Prix exponentiel (base × 1,1^level), gain linéaire avec pas défini par stat.
  - **Débloquer des upgrades** : certains upgrades ne sont achetable en run qu’après déblocage en meta (coût en coins une fois).
- Les **valeurs de départ** (stats de base) utilisées pour une partie sont celles du **profil meta** au moment du lancement ; elles sont injectées dans les GameParams (ou équivalent) pour que la run reste déterministe.

Stockage : **localStorage** (clé dédiée, ex. `towerdefense_meta`). API / compte serveur plus tard.

---

## 6 — Déblocage par paliers (milestones)

- **Idée** : débloquer des contenus (ex. upgrades, options de difficulté) tous les **X paliers** atteints (ex. vague 5, 10, 15… ou paliers de difficulté).
- **À définir** : liste des paliers (vague ou difficulté) et ce que chaque palier débloque (un upgrade, une option, etc.).
- **Implémentation** : stocker en meta la **meilleure vague atteinte** (et éventuellement par niveau de difficulté) ; à chaque fin de run, mettre à jour ce max et calculer les déblocages éligibles. Ne pas faire dépendre la logique déterministe de la run de ces déblocages : ils affectent seulement ce qui est **disponible** ou les **params** de la prochaine run.

---

## 7 — Ennemi à distance (ranged)

- **Plus tard** : ajouter un archétype d’ennemi qui reste à distance et **tire des projectiles** vers le joueur.
- **Technique** : projectiles ennemis (position, direction, dégâts, vitesse) gérés dans le domaine comme les projectiles joueur ; spawn et mise à jour **déterministes** (seed + frame). Collision avec le joueur → dégâts (après armure % puis armure fixe).

---

## 8 — Classes de personnage

- **Plus tard** : idée de **classes** avec des capacités / stats de base différentes. À garder en tête ; pas de spec pour l’instant. Les classes pourraient définir l’ensemble des stats de base et la liste (ou l’arbre) d’upgrades disponibles, le tout dans les params de partie pour rester déterministe.

---

## 9 — Récapitulatif des contraintes

| Contrainte | Règle |
|------------|--------|
| **Déterministe** | Seed + GameParams + séquence d’inputs → même résultat. Aucun `Math.random()` libre ; tout aléatoire (ex. crit, multi-tir) dérive de la seed et de la frame. |
| **Actions joueur en partie** | Uniquement **achats d’upgrades**. Pas de capacité à cooldown ni d’action tactique supplémentaire. |
| **Choix du joueur** | Pas de limite artificielle du nombre d’upgrades par type ou par catégorie en run : le joueur choisit librement où investir son cash. |
| **Sauvegarde vs gains** | Si le joueur sauvegarde la partie (replay), il ne reçoit **pas** les coins de la run. Gains de coins uniquement à la mort ou en quittant sans sauvegarder. |

---

## 10 — Ordre de mise en œuvre suggéré

1. **Monnaies** : distinguer cash (run) et coins (meta) dans le domaine et l’UI ; persister les coins (localStorage).
2. **Gain de coins** : variable de run (coin/wave, coin/boss, % coin/wave) ; à la mort ou quitter, créditer les coins et les sauvegarder ; ne pas créditer si sauvegarde.
3. **GameParams** : ajouter difficulty % et facteur de coût (factor 1,1) ; étendre Player et params avec les nouveaux stats (armure %, armure fixe, cash %, thorns, crit, range damage K, etc.) et les appliquer dans les formules (dégâts reçus, gains cash, gains coins).
4. **Upgrades** : définitions (UpgradeDef) avec catégorie, pas, coût (base × 1,1^level) ; plafonds 99 % pour les réductions.
5. **Meta-progression** : écran / flux pour dépenser les coins (amélioration des stats de départ, déblocage d’upgrades) et injection dans les params de partie.
6. **UI** : catégories Attack / Defense / Economy / Utility pour afficher et filtrer les upgrades.
7. **Paliers** : table de milestones (vague ou difficulté) et déblocages associés ; mise à jour du max atteint en fin de run.
8. **Ennemi ranged** : archétype + projectiles ennemis, déterministes.

---

*Ce document peut être utilisé comme référence de design et checklist d’implémentation.*
