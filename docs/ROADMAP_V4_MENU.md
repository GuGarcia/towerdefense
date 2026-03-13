# Roadmap Menu — Interface complète (Menu / Settings / Paramètres de partie)

Ce document décrit la roadmap pour une interface complète : menu principal, paramètres applicatifs, formulaire « Partie personnalisée », liste des parties et partage. Elle est réalisée dans **`front/`** après la migration prévue dans `docs/ROADMAP_V3_AUDIT.md`.

**Lancer le jeu** : à la racine, `make dev` ou `cd front && bun run dev`.

---

## Choix de design

| Décision | Choix |
|----------|--------|
| **Framework** | React (router, i18n, formulaires et liste de replays plus simples à gérer). Si préférence pour rester vanilla, prévoir un mini routeur et écrans = divs affichées/masquées. |
| **Navigation** | Écrans pleine page (pas d’overlays pour le menu principal). |
| **Démarrage** | Page d’accueil = menu principal ; « Jouer » lance une partie avec params par défaut. |
| **Partie personnalisée** | Entrée menu → formulaire complet (sliders min/max) → bouton « Lancer la partie » en fin de formulaire. |
| **Durée de partie** | Pas de durée limite exposée dans l’UI ; partie jusqu’à Game Over. |
| **Langue** | FR et EN ; i18n prévu dans toute l’app (clés + fichiers de traduction). |
| **Volume** | Préparer le slot (slider ou placeholder) pour plus tard ; pas de son pour l’instant. |
| **Persistance** | Sauvegarde des réglages (langue, volume) et de la liste des parties en localStorage à la sortie. |
| **Partage** | Liste des parties jouées + possibilité de partager (lien de config seed+params et/ou export fichier replay). |

---

## 1 — Structure des écrans et routes

- [x] **1.1** Définir les routes (ou écrans) :
  - `/` — Menu principal
  - `/custom` — Formulaire « Partie personnalisée »
  - `/play` — En jeu (canvas + HUD)
  - `/replay` — Liste des parties enregistrées
  - `/settings` — Paramètres applicatifs (volume, langue)
- [x] **1.2** Menu principal : titre, boutons **Jouer**, **Partie personnalisée**, **Charger un replay**, **Paramètres**, (optionnel) **Quitter**.
- [x] **1.3** Depuis « Jouer » : lancement direct d’une partie avec params par défaut (seed aléatoire).
- [x] **1.4** Depuis « Partie personnalisée » : navigation vers formulaire ; en fin de formulaire, « Lancer la partie » → `/play` avec params du formulaire.
- [x] **1.5** Pause en jeu (ESC) : overlay plein écran avec **Reprendre**, **Paramètres**, **Quitter** (retour au menu).
- [x] **1.6** Game Over : overlay avec stats (vague, temps, ennemis tués) + **Rejouer** + **Retour au menu**.

---

## 2 — i18n (FR / EN)

- [x] **2.1** Mettre en place un mécanisme de traduction (contexte React + clés, ou lib type react-i18next).
- [x] **2.2** Fichiers de traduction (ex. `src/i18n/fr.json`, `src/i18n/en.json`) avec clés pour : menu, formulaire partie, paramètres app, pause, game over, liste replays.
- [x] **2.3** Tous les textes visibles passent par les clés (aucune chaîne en dur pour l’UI).
- [x] **2.4** Choix de langue stocké dans les settings et appliqué au chargement.

---

## 3 — Paramètres applicatifs (écran Settings)

- [x] **3.1** Écran `/settings` : langue (FR / EN), volume (slider ou placeholder pour plus tard).
- [x] **3.2** Sauvegarde des réglages en quittant l’écran ou au changement (localStorage, ex. clé `towerdefense_settings`).
- [x] **3.3** Au démarrage de l’app, charger les settings et appliquer la langue (et le volume quand implémenté).

---

## 4 — Formulaire « Partie personnalisée »

- [ ] **4.1** Page `/custom` avec formulaire structuré en sections (ou onglets) : **Joueur**, **Économie**, **Vagues**, **Ennemis**.
- [ ] **4.2** **Joueur** : sliders avec min/max (ex. vie 50–200, dégâts 5–30, regen 0–0.5, attaque 0.5–5, portée 150–500). Valeurs par défaut = `createGameParams()`.
- [ ] **4.3** **Économie** : coût de base et incrément des upgrades ; or par kill (base, rapide, boss) ; bonus de vague (base, incrément).
- [ ] **4.4** **Vagues** : facteur difficulté vague 1 ; scaling (vie, vitesse, dégâts, nombre) ; boss toutes les N vagues.
- [ ] **4.5** **Ennemis** : pour chaque archétype (base, rapide, boss), exposer vie, vitesse, dégâts, taille, nombre par vague (min/max cohérents avec `GameParams`).
- [ ] **4.6** Champ **Seed** : input number + bouton « Aléatoire ».
- [ ] **4.7** Boutons : **Annuler** (retour menu), **Lancer la partie** (construire `GameParams` depuis le formulaire, aller sur `/play`).
- [ ] **4.8** Référence des plages recommandées : voir section « Référence sliders » en fin de document.

---

## 5 — Liste des parties et sauvegarde

- [ ] **5.1** Persistance : clé localStorage (ex. `towerdefense_replays`) pour une liste d’entrées (id, date, seed, params, recording ou ref, résumé : vague, temps, ennemis tués).
- [ ] **5.2** À la fin d’une partie (Game Over) ou sur action « Sauvegarder », ajouter l’entrée à la liste (avec politique de limite, ex. 20–50 dernières parties).
- [ ] **5.3** Écran « Charger un replay » (ou `/replay`) : afficher la liste ; pour chaque entrée : infos + **Charger** (lance le replay) + **Partager**.
- [ ] **5.4** Option file picker conservée pour charger un replay depuis un fichier JSON externe.

---

## 6 — Partage

- [ ] **6.1** « Partager » : au minimum export du fichier replay (JSON) déjà existant ; idéalement en plus : génération d’un **lien de configuration** (seed + params encodés en query ou hash) pour que quelqu’un puisse lancer la même config.
- [ ] **6.2** Si lien de config : au chargement de l’URL avec paramètre, proposer « Lancer cette configuration partagée » (préremplir ou lancer directement).

---

## 7 — Intégration technique

- [x] **7.1** Si React : ajouter React + React Router, point d’entrée qui monte l’app dans un `#root` ; composant « Game » qui encapsule le canvas et la logique actuelle de `index.ts`.
- [x] **7.2** Réutiliser le domaine et l’infra existants (`createGame`, `createGameParams`, `tick`, rendu, replay) sans les dupliquer ; le jeu reste déterministe (seed + params + inputs).
- [ ] **7.3** Gestion de la durée de partie : soit `durationFrames` très grand (ex. 1 an en frames), soit logique « pas de limite » dans la boucle (jouer jusqu’à Game Over uniquement).

---

## Référence — Plages suggérées pour les sliders (Partie personnalisée)

Valeurs par défaut = `createGameParams()`. Min/max à adapter si le balancing évolue.

| Section | Paramètre | Def | Min | Max | Pas |
|---------|-----------|-----|-----|-----|-----|
| Joueur | Vie initiale | 100 | 50 | 200 | 5 |
| Joueur | Dégâts initiaux | 10 | 5 | 30 | 1 |
| Joueur | Régénération | 0.1 | 0 | 0.5 | 0.05 |
| Joueur | Vitesse d’attaque (tirs/s) | 2 | 0.5 | 5 | 0.25 |
| Joueur | Portée | 300 | 150 | 500 | 25 |
| Économie | Coût de base upgrades | 10 | 5 | 30 | 1 |
| Économie | Incrément coût par niveau | 5 | 0 | 20 | 1 |
| Économie | Or/kill base / rapide / boss | 10, 5, 100 | (5–25), (2–15), (50–200) | — | 1, 1, 10 |
| Économie | Bonus vague base / incrément | 5, 5 | 0–15 | — | 1 |
| Vagues | Facteur difficulté vague 1 | 0.6 | 0.3 | 1 | 0.1 |
| Vagues | Scaling vie / speed / damage / count | 1.1, 1.02, 1.05, 1.1 | 1.0–1.25 (approx.) | — | 0.01 |
| Vagues | Boss toutes les N vagues | 10 | 5 | 20 | 1 |
| Ennemis | Base : vie, speed, damage, size, countPerWave | 20, 2, 5, 12, 5 | à définir (ex. ±50 % autour du défaut) | — | selon besoin |
| Ennemis | Rapide / Boss | idem | idem | — | — |

---

*Ce document peut être utilisé comme checklist : cocher les tâches au fur et à mesure (`[x]`).*
