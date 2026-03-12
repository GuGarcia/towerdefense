# Prompt pour l’analyse d’équilibrage

Copie-colle ce bloc quand tu veux que j’analyse les rapports de simulation et que j’ajuste les paramètres.

---

## Objectif à garder en tête

- **Run max** : 10 min (36 000 frames) — une partie s’arrête au Game Over ou à cette limite.
- **Équilibrage** : courbe **normale** avec **sommet à ~8 min** (28 800 frames).
  - La **moyenne** des durées de survie doit être proche de 8 min.
  - Certaines parties finissent avant, d’autres atteignent jusqu’à 10 min — pas tout le monde à 10 min, pas tout le monde à 5 min.
- Les trois profils (full, two, one) doivent avoir une moyenne proche de 8 min, sans qu’un profil soit trop favorisé ou défavorisé.

Dans les rapports : viser **pctOfPeak ~ 100 %** (moyenne = 28 800 frames = 8 min). Le champ **targetPeakFrames** = 28800 dans le JSON.

---

**Prompt à me donner :**

```
Analyse les rapports de simulation dans player/rapport/ (prendre le ou les derniers rapports par date/heure).

Pour chaque profil (full, two, one), regarde le % du sommet 8 min (pctOfPeak), les stats (meanFrames, P50, meanWave) et le % max 10 min (pctOfTarget) si utile.

Objectif : courbe normale avec sommet à ~8 min — les trois profils doivent avoir une moyenne proche de 8 min (pctOfPeak ~ 100 %), sans qu’un profil soit trop favorisé ou défavorisé. Run max = 10 min.

Ensuite :
1. Résume ce que disent les rapports (écarts au sommet 8 min par profil).
2. Propose des modifications à player/gameparams.json (economy, player, wave, enemies) pour rapprocher l’équilibre de cet objectif, en t’appuyant sur les chiffres.
3. Applique les changements dans gameparams.json.

Après ça je relancerai make simulate pour voir le nouveau rapport.
```

---

**Variante courte :**

```
Analyse le dernier rapport dans player/rapport/, compare les 3 profils au sommet 8 min (pctOfPeak), et modifie player/gameparams.json pour améliorer l’équilibre (courbe normale, sommet ~8 min, max 10 min). Résume les changements.
```

---

**Variante « seulement proposer » (sans éditer le fichier) :**

```
Analyse les rapports dans player/rapport/ et propose des modifications pour player/gameparams.json pour que full, two et one aient une moyenne ~8 min (courbe normale, sommet à 8 min, max 10 min). Ne pas éditer le fichier, juste lister les changements à faire.
```
