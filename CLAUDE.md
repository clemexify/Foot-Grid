# Foot Grid — CLAUDE.md

## Concept

Jeu de grille quotidien (style "Immaculate Grid") adapté au foot européen.
Grille 3×3 : chaque case = joueur ayant joué dans les deux clubs/sélections en ligne et colonne.
4 erreurs max. Partage résultat via émojis WhatsApp 🟢⬛ à la fin.

## Architecture

Projet **fichier unique** : tout le jeu est dans `index.html` (HTML + CSS + JS inline, ~470 lignes).
Pas de build, pas de dépendances npm — ouvrir directement dans un navigateur.

```
index.html          → le jeu complet (HTML/CSS/JS)
players_clean.json  → BDD joueurs (470 joueurs, générée par pipeline Python)
players_raw.json    → données brutes Transfermarkt avant nettoyage
extract_players.py  → scrape l'API Transfermarkt locale → players_raw.json
clean_players.py    → normalise players_raw.json → players_clean.json
cache/              → cache HTTP des appels API (players_*, profile_*, transfers_*)
venv/               → venv Python pour les scripts d'extraction
```

## Structure des données joueur

```json
{
  "id": "1004301",
  "nom": "Jérémy Jacquet",
  "nationalites": ["France", "Guadeloupe"],
  "carriere": [
    { "club": "Liverpool",  "annee_debut": 2026, "annee_fin": null },
    { "club": "Rennes",     "annee_debut": 2024, "annee_fin": 2026 },
    { "club": "Clermont",   "annee_debut": 2023, "annee_fin": 2024 }
  ]
}
```

- `carriere` est ordonnée du plus récent au plus ancien
- `annee_fin: null` = club actuel
- Les dates correspondent à l'année de début de saison (ex: 2024 = saison 2024/25)
- Les clubs jeunes/réserves sont filtrés lors du nettoyage

## Modes de jeu

| Code CSS | Nom      | Difficulté | Axes de la grille                        |
|----------|----------|------------|------------------------------------------|
| `cc`     | Normal   | ★★☆        | Club × Club                              |
| `ca`     | Sélection| ★★★        | Sélection nationale × Club               |
| `cs`     | Doubles  | ★★★★       | Sélection × Sélection (doubles nat.)     |
| *(futur)*| Expert   | ★★★★★      | Club × Année — nécessite dates carrière  |

## Grilles

Les grilles sont prédéfinies en dur dans `index.html` (objet `GRILLES`), 2 grilles par mode.
La rotation se fait par jour de l'année : `grille = GRILLES[mode][Math.floor(jourAnnée / 183)]`

Validation en deux passes :
1. Cherche dans les solutions prédéfinies
2. Vérification dynamique dans `players_clean.json`

## Pipeline d'extraction (scripts Python)

L'API Transfermarkt utilisée est **non officielle** : instance locale via `felipeall/transfermarkt-api`.

```bash
# Démarrer l'instance locale de l'API (port 8000)
cd venv && uvicorn ... # (voir doc du repo felipeall/transfermarkt-api)

# Extraire les joueurs L1 2025/26
python extract_players.py   # → players_raw.json  (~cache HTTP dans cache/)
python clean_players.py     # → players_clean.json
```

`extract_players.py` : scrape clubs L1 (FR1 / saison 2025) → joueurs par club → profil + transfers par joueur.
`clean_players.py` : normalise noms de clubs (`CLUBS_MAP`), traduit nationalités (`NATS_MAP`), filtre équipes jeunes, calcule `annee_fin`.

## Design system (CSS variables)

```css
--vert:       #00a550   /* couleur principale */
--or:         #ffd700   /* mode Normal / années */
--violet:     #9b59b6   /* mode Sélection */
--rouge:      #e63946   /* erreurs */
--noir:       #080c08
--blanc:      #f0f4f0
```

Polices : **Barlow Condensed** (titres, UI) + **Barlow** (texte courant) — Google Fonts.

## Roadmap

- [ ] Mode Expert : Club × Année (ex: PSG 2015) — structure de données déjà prête
- [ ] Étendre la BDD aux 5 grands championnats (PL=GB1, Liga=ES1, Bundesliga=L1, Serie A=IT1)
- [ ] Grilles supplémentaires / système de rotation hebdomadaire
