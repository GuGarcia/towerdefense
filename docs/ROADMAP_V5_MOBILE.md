# Roadmap Mobile — Rendre l’application utilisable sur mobile

Ce document détaille les adaptations nécessaires pour que l’application Tower Defense soit confortablement utilisable sur smartphones et tablettes (navigateur mobile, éventuellement PWA).

**Contexte** : l’app est une SPA React (front/) avec menu, formulaire « Partie personnalisée », écran de jeu (canvas + barre d’upgrades + pause), liste des replays et paramètres. Le jeu n’utilise pas la souris pour viser (uniquement clics sur boutons d’upgrade et overlays). Le viewport meta est déjà présent dans `index.html`.

---

## 1 — Viewport et comportement du navigateur

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **1.1** Viewport | Déjà en place : `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`. Vérifier qu’aucun autre meta ne le surcharge. | ✅ Fait |
| **1.2** Empêcher le zoom involontaire en jeu | Sur la page de jeu (`/play`), ajouter `user-scalable=no` ou gérer `touch-action: none` sur le canvas pour éviter le pinch-zoom pendant la partie. Alternative : laisser le zoom mais éviter les double-tap zoom sur les boutons. | Moyenne |
| **1.3** Pull-to-refresh | Désactiver le pull-to-refresh sur la zone jeu (body ou #root en plein écran) quand on est sur `/play`, pour ne pas recharger la page en pleine partie. CSS `overscroll-behavior: none` ou JS `preventDefault` sur touchmove. | Moyenne |
| **1.4** Barre d’adresse / mode standalone | Pour une expérience type « app », prévoir un manifest PWA (§7) avec `display: standalone` ou `minimal-ui`. | Basse |

---

## 2 — Touch et entrées

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **2.1** Clics = taps | Les événements `click` sont déjà déclenchés par un tap sur mobile. S’assurer qu’aucun délai important (ex. 300 ms) n’est ajouté (les navigateurs modernes l’ont en grande partie supprimé). Pas de changement majeur attendu. | Faible |
| **2.2** Zone tactile du canvas | Le canvas ne reçoit pas de clic pour le gameplay (pas de visée souris). Les seules zones interactives sont les barres d’upgrade et les overlays. Vérifier que les boutons de l’overlay Game Over et Pause restent bien cliquables (z-index, taille). | Faible |
| **2.3** Pas de hover sur mobile | Remplacer ou compléter les styles `:hover` par des états visibles au focus / `:active` pour les boutons, afin que le feedback soit clair au doigt. Vérifier `player.css` (boutons upgrade, overlay) et les styles inline des pages. | Moyenne |

---

## 3 — Mise en page responsive

### 3.1 Page de jeu (`PlayPage`, `/play`)

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **3.1.1** Barre de pause | Actuellement : flex avec « Pause », « Auto », et les boutons 1x–10x côte à côte. Sur petit écran, tout ne tient pas. Adapter : passer en `flex-wrap` ou regrouper les vitesses dans un menu déroulant / sous-menu, ou réduire padding et taille de police. | Haute |
| **3.1.2** Barres d’upgrade (`#upgrade-bars`) | Une barre par joueur avec life bar (100px min), 5 boutons d’upgrade, argent. En mobile portrait, une seule barre peut déjà dépasser. Options : (a) scroll horizontal avec `overflow-x: auto` et barres en `min-width`, (b) réduire le nombre de boutons visibles (icônes + menu), (c) life bar plus courte et texte plus petit. Adapter `player.css` et éventuellement `setupUpgradeBars.ts` (structure ou classes). | Haute |
| **3.1.3** Canvas | Déjà en `width: 100%`, `height: 100%` et `resize()` dans `player/index.ts` qui fait `canvas.width = clientWidth`, `canvas.height = clientHeight`. Le rendu s’adapte. Vérifier le ratio (portrait vs paysage) : en portrait le canvas peut être très haut et étroit ; le jeu reste jouable mais l’affichage peut être dégradé. Option : encourager l’orientation paysage pour le jeu (message ou lock orientation si supporté). | Moyenne |
| **3.1.4** Overlay Pause | Liste de boutons (Reprendre, Export, Charger replay, Paramètres, Quitter). En petit écran, s’assurer que la liste ne déborde pas et reste scrollable si besoin. Augmenter un peu la zone de tap si les boutons sont trop serrés. | Moyenne |
| **3.1.5** Overlay Game Over | Même principe : titre, stats, boutons Rejouer / Retour / Sauvegarder. Vérifier tailles et espacements. | Moyenne |

### 3.2 Menu principal (`MenuPage`, `/`)

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **3.2.1** Titre et boutons | Titre 42px, boutons 18px. Sur très petit écran, réduire avec une media query (ex. titre 28px, boutons 16px) ou utiliser `clamp()`. | Moyenne |
| **3.2.2** Bannière config partagée | Déjà en `flexWrap: wrap`. Vérifier padding et lisibilité sur étroit. | Faible |

### 3.3 Partie personnalisée (`CustomPage`, `/custom`)

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **3.3.1** Formulaire | Beaucoup de lignes (sliders + labels). Les `rowStyles` sont en flex avec `minWidth: 180px` pour les labels. En mobile : (a) empiler label au-dessus du slider (flex-direction: column) ou (b) réduire min-width et taille de police. Adapter les sections pour qu’elles restent lisibles. | Haute |
| **3.3.2** Sliders | Les `<input type="range">` sont plus difficiles à manipuler au doigt. S’assurer qu’ils ont une hauteur tactile suffisante (min-height ou padding). Éviter les zones de tap trop petites. | Moyenne |
| **3.3.3** Bloc « Mes configs » | Input + boutons Sauvegarder / Export + liste des configs. En étroit, passer les boutons à la ligne ou les mettre sous l’input. | Moyenne |
| **3.3.4** Défilement | La page a `overflowY: auto`. Vérifier que le scroll fonctionne bien sur mobile (pas de blocage par overflow hidden sur un parent). | Faible |

### 3.4 Replay (`ReplayPage`, `/replay`)

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **3.4.1** Liste et cartes | `maxWidth: 560px`, lignes en flex wrap. Sur mobile, la largeur sera 100 % du viewport. Les boutons Charger / Partager par entrée doivent rester accessibles (taille de tap). | Moyenne |

### 3.5 Paramètres (`SettingsPage`, `/settings`)

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **3.5.1** Champs | Peu d’éléments. Vérifier taille du select et du slider volume, et du lien Retour. | Faible |

---

## 4 — Tailles de cibles tactiles (accessibilité)

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **4.1** Zone de tap minimale | Recommandation courante : au moins 44×44 px pour les contrôles interactifs. Auditer tous les boutons (menu, pause, upgrade, overlay, formulaire custom, replay). Agrandir padding ou min-height/min-width où nécessaire. | Haute |
| **4.2** Espacement | Éviter que deux boutons soient trop proches (risque de tap accidentel). Garder un gap suffisant entre les boutons de vitesse, d’upgrade, etc. | Moyenne |

---

## 5 — Typographie et lisibilité

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **5.1** Tailles de police relatives | Remplacer les tailles fixes (11px, 12px, 18px, etc.) par des valeurs responsives (media queries ou `clamp()`) pour que les textes restent lisibles sur petit écran sans être disproportionnés sur grand écran. Cibler en priorité : barre d’upgrade (11px), boutons de pause, titres. | Moyenne |
| **5.2** Contraste | Conserver un contraste suffisant (texte cyan sur fond sombre) pour la lisibilité en extérieur ou sur écran moyen. Pas de changement attendu si la charte actuelle est respectée. | Faible |

---

## 6 — Safe area (encoches, barre d’état, indicateur d’accueil)

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **6.1** Padding safe area | Sur iPhone X et suivants (et certains Android), utiliser `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, etc., pour que le contenu ne soit pas masqué par l’encoche ou la barre de navigation. Appliquer sur le conteneur principal (ex. body ou #root) et éventuellement sur la barre de pause et la barre d’upgrades. Prévoir un viewport qui inclut `viewport-fit=cover` si on veut le plein écran. | Moyenne |

Exemple CSS :

```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

Et dans le viewport (si besoin) :  
`<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`

---

## 7 — PWA et « Ajouter à l’écran d’accueil » (optionnel)

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **7.1** Manifest | Ajouter un `manifest.json` (ou équivalent) avec nom, short_name, icônes (plusieurs résolutions), `display: standalone` ou `minimal-ui`, `theme_color`, `background_color`. | Basse |
| **7.2** Service Worker | Pour un mode hors-ligne basique ou un chargement plus rapide, enregistrer un service worker. Peut être fait dans un second temps. | Basse |
| **7.3** Icônes | Fournir au moins une icône 192×192 et une 512×512 pour le splash et l’écran d’accueil. | Basse |

---

## 8 — Orientation et ratio d’écran

| Tâche | Détail | Priorité |
|-------|--------|----------|
| **8.1** Message orientation | En portrait, le canvas peut être très étroit. Option : afficher un message du type « Pour une meilleure expérience, tournez votre appareil en paysage » sur `/play` quand `window.innerWidth < window.innerHeight` (ou seuil proche). Masquer le message en paysage. | Basse |
| **8.2** Lock orientation | L’API Screen Orientation (lock) n’est pas supportée partout et peut être intrusive. À considérer seulement si le jeu devient vraiment illisible en portrait. | Basse |

---

## 9 — Récapitulatif des priorités

- **Haute** : Barre de pause et barres d’upgrade sur petit écran ; formulaire Custom responsive ; tailles de cibles tactiles.
- **Moyenne** : Comportement navigateur (zoom, pull-to-refresh), feedback tactile (hover/active), canvas/overlays en petit écran, sliders et blocs Custom, Replay, safe area, typo responsive.
- **Basse** : PWA, orientation, détails de polish.

---

## 10 — Ordre de mise en œuvre suggéré

1. **Layout jeu** : barre de pause (wrap ou menu) + barres d’upgrade (scroll horizontal ou réduction) + media queries pour petits écrans.
2. **Cibles tactiles** : audit des boutons, padding/min-size 44px.
3. **Custom page** : formulaire en colonne sur petit écran, sliders et boutons plus grands.
4. **Safe area** : viewport-fit et padding env(safe-area-inset-*).
5. **Comportement** : overscroll-behavior / prevention du refresh sur la page jeu ; ajustement hover/active.
6. **Typo** : clamp() ou media queries pour les textes critiques.
7. **Optionnel** : PWA manifest, message d’orientation paysage.

---

*Ce document peut être utilisé comme checklist : cocher les tâches au fur et à mesure.*
