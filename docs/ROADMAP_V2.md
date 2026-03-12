# Roadmap V2 — Évolutions gameplay

Utiliser ce fichier comme checklist : cocher les tâches au fur et à mesure (`[x]`).

L’application vit dans le dossier `**player/**` ; le code source est sous `**player/src/**`.  
**Lancer le jeu** : à la racine du projet, `make dev` (Docker + Bun) ou `cd player && bun run dev` (Bun en local).

---

## Choix de design (V2)

| Décision | Choix |
|----------|--------|
| **Objectif** | Tenir le plus longtemps possible (pas de condition de victoire, score = durée / vague) |
| **Contrôle** | Auto-aim conservé ; pas d’autres actions que les upgrades ; pas de mouvement du joueur |
| **Ennemis collés** | Au contact : l’ennemi reste collé (pas supprimé), pas de hitbox bloquante (plusieurs peuvent se coller). Chaque ennemi collé inflige **un coup** (e.damage) toutes les **X frames** (pas du DoT continu) |
| **Bonus or** | Bonus de tune à chaque nouvelle vague : 5 $ en vague 1, +5 $ par vague (vague 2 = 10 $, vague 3 = 15 $, etc.) |
| **Difficulté** | Exponentielle : on commence très simple, nombre d’ennemis et caractéristiques augmentent vague après vague |
| **Range** | Nouvelle caractéristique du joueur (portée de tir) améliorable via un nouvel upgrade |
| **Visuel ennemis** | Carrés orientés vers le centre (remplacer les cercles) ; on garde les 3 archétypes (base, rapid, boss) |
| **Son / images** | Améliorations son et visuelles reportées plus tard |

---

## 1 — Game Over & UI

- [ ] Au game over : **cacher le reste de l’UI** (barres d’upgrade, etc.)
- [ ] Afficher en **gros** le titre « GAME OVER »
- [ ] En dessous : **Vague X · Ennemis tués X · Temps écoulé** (stats de la partie)
- [ ] En dessous : bouton **Rejouer**
- [ ] (Optionnel) Persister / afficher le meilleur score (vague ou temps)

---

## 2 — Bonus or par vague

- [ ] Ajouter dans `GameParams` (ou logique de vague) : **bonus or par vague** (formule : 5 + (waveNumber - 1) × 5, ou équivalent)
- [ ] À chaque **début de nouvelle vague** (ou fin de vague précédente), créditer le joueur du bonus
- [ ] Déterministe : même seed + même frame = même bonus

---

## 3 — Ennemis collés (stick) & dégâts toutes les X frames

- [ ] **Comportement** : quand un ennemi atteint le centre (distance ≤ rayon hitbox joueur), il ne meurt plus ni ne disparaît ; il reste **collé** au joueur
- [ ] Pas de hitbox bloquante : d’autres ennemis peuvent aussi se coller (plusieurs ennemis collés en même temps)
- [ ] Chaque ennemi collé inflige **e.damage** au joueur **toutes les X frames** (ex. 60 frames = 1 coup par seconde). Paramètre X dans `GameParams` ou sur l’ennemi
- [ ] Les ennemis collés restent ciblables par les projectiles (auto-aim sur le plus proche, donc souvent ceux sur le joueur)
- [ ] Définir position / état « collé » pour le rendu (ex. position fixe sur le bord du pentagone) si besoin
- [ ] Adapter le calcul des dégâts joueur : au lieu d’un seul coup au contact puis suppression, appliquer les coups périodiques pour chaque ennemi collé

---

## 4 — Upgrade Range (portée)

- [ ] Ajouter **range** (portée de tir) au **Player** : valeur initiale dans `GameParams.player` (ex. `initialRange`)
- [ ] Ajouter **UpgradeType.Range** (ou équivalent) et formule de coût dans l’économie
- [ ] Logique de tir : ne considérer que les ennemis à **distance ≤ range** pour choisir la cible ; ne tirer que s’il y a au moins un ennemi dans la portée
- [ ] UI : nouveau bouton / raccourci pour acheter l’upgrade Range, affichage de la portée actuelle si pertinent

---

## 5 — Difficulté exponentielle

- [ ] S’assurer que le **scaling** des vagues (nombre d’ennemis, vie, dégâts, vitesse) est bien **exponentiel** (déjà via `difficultyScaling` dans `GameParams`)
- [ ] Ajuster pour que le **début** soit très facile (vague 1 très douce), puis montée nette vague après vague
- [ ] Option : offset ou facteur de scaling qui ne s’applique qu’à partir de la vague 2 pour garder la vague 1 très simple

---

## 6 — Ennemis en carrés orientés vers le centre

- [ ] **Domaine** : ajouter une notion d’**orientation** (angle vers le centre) pour les ennemis, ou la dériver de la position (direction vers le centre)
- [ ] **Rendu** : dans `CanvasRenderer`, dessiner les ennemis en **carrés** (au lieu de cercles), **orientés vers le centre** du terrain
- [ ] Garder les 3 archétypes (base, rapid, boss) et leurs couleurs / tailles

---

## 7 — Indicateur « Prochaine vague »

- [ ] Afficher dans l’UI (ex. en haut à gauche ou près du HUD de vague) : **« Prochaine vague : X base, Y rapid, [1 boss] »**
- [ ] Utiliser le spawn déterministe (`WaveSpawner`) pour connaître la composition de la prochaine vague
- [ ] Option : afficher seulement quand la vague en cours est proche de se terminer

---

## 8 — Réglages & balance

- [ ] Ajouter les nouveaux paramètres dans `GameParams` / `gameparams.json` : bonus or par vague, intervalle de frames pour les coups des ennemis collés, range initiale, etc.
- [ ] Mettre à jour [GAME_PARAMS.md](./GAME_PARAMS.md) si besoin
- [ ] Ajuster la balance (coûts d’upgrades, scaling) pour un bon ressenti avec le nouveau gameplay (stick + range)

---

## Plus tard (hors V2)

- Son et images (feedback visuel / audio des tirs, dégâts, game over)
- Indicateur « Prochaine vague » peut être fait en même temps que le polish UI si on préfère
- Vérification serveur, nouveaux modes, etc. (comme dans la roadmap d’origine)
