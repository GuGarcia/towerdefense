# Suggestions — Idées de design

## Scoring : vague × ennemis tués (+ facteur difficulté)

### Idée de base

- **Score = nombre de vagues atteintes × ennemis tués**
- Récompense à la fois la **durée de survie** (vague) et l’**efficacité** (kills).
- Plus on avance en vague, plus il y a d’ennemis par vague (scaling), donc le score monte fort en fin de run.

Variante simple : **score = vague_max_atteinte × total_ennemis_tués**, calculé au Game Over ou à la sortie.

### Avec un facteur de difficulté

Si on ajoute un multiplicateur de difficulté **d** (ex. 1.0 = normal, 1.5 = difficile) dans les paramètres de partie :

**Score = vague × ennemis_tués × d**

- **Récompense du risque** : à même vague et même kills, une partie en difficile rapporte plus (×d).
- **Plus d’ennemis** : si la difficulté augmente aussi le nombre de spawns (comme prévu en roadmap), en survivant longtemps on a plus d’ennemis à tuer → `ennemis_tués` plus élevé **et** en plus le multiplicateur ×d. Donc plus de difficulté → potentiel de score plus gros (facteur + volume de kills si on tient la distance).
- En difficile on peut aussi mourir plus tôt (moins de vagues, moins de kills) : la formule reste équitable.

### Détails à trancher

| Point | Option |
|-------|--------|
| **Vague utilisée** | Vague **max atteinte** (au moment de la mort / quitter) est la plus simple et lisible. |
| **Où appliquer d** | Dans les **GameParams** (ex. `difficultyScoreFactor` ou un `difficultyMultiplier` global), pour garder le replay déterministe. |
| **Équilibrage** | Ajuster d (ex. 1.2 / 1.5 / 2.0) selon la récompense voulue. |

### Contexte technique actuel

- Le jeu a déjà `enemiesKilled` et `frameIndex` ; la vague est dérivée via `getWaveNumberAtFrame(frameIndex, params)`.
- Il n’y a pas encore de score affiché ou persisté.
- La difficulté (ROADMAP V7) est prévue comme multiplicateur global (50% / 100% / 150%) sur les stats des ennemis.
