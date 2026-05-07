# Foot Grid — CLAUDE.md

## Concept

Jeu de grille quotidien (style "Immaculate Grid") adapté au foot européen. Chaque jour le défi change et est proposé selon 3 modes de jeu.
Grille 3×3 : chaque case = joueur ayant joué dans les deux clubs/sélections en ligne et colonne.
4 erreurs max. Partage résultat via émojis WhatsApp 🟢⬛ à la fin.
L'idée est de trouver le bon équilibre entre difficulté du jeu, satisfaction personnelle, défi versus ses amis pour que les utilisateurs reviennent et construire une base importante d'utilisateurs quotidiens

## Architecture

Projet **fichier unique** : tout le jeu est dans `index.html` (HTML + CSS + JS inline, ~470 lignes).
Pas de build, pas de dépendances npm — ouvrir directement dans un navigateur.

```
index.html          → le jeu complet (HTML/CSS/JS)
players_clean.json  → BDD joueurs (470 joueurs, générée par pipeline Python)
    > cette base contient pour l'instant seulement les joueurs de ligue 1 de la saison 2025/2026. à terme elle devra contenir l'ensemble de la base de 1ère division des 5 grands championnats sur un historique de 20 ans 
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

Club × Club                              |
Sélection nationale × Club               |
Sélection × Sélection (doubles nat.) > un mode de jeu abandonné au cours des travaux
Club × tranche d'années (exemple : marseille x 2010-2012)

## Grilles

Pour le test, Les grilles sont prédéfinies en dur dans `index.html` (objet `GRILLES`), 2 grilles par mode.
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

BDD
- charger l'historique de données sur transfer markt (PL=GB1, Liga=ES1, Bundesliga=L1, Serie A=IT1 et historique depuis 20 ans voire 30 si possible car les ref des millenials vont jusque là)
- organiser la mise à jour de la BDD à la fin de chaque mercato par incrément (ne pas tout recharger si possible)

Jeu
- remplacer le mode de jeu club x année par club x tranche d'années de 2 ou 3 ans pour que ce soit moins ciblé
- revoir la fonction de partage whatsapp car le format affiché dans whatsapp est un peu austère et les emoji se transforme en caractère d'erreur
- organiser la rotation quotidienne des questions
- Permettre au joueur d'avoir son historique de performance dans son navigateur
- à la saisie d'un nom dans la barre de recherche de joueur, chercher par nom et par prénom. Et ne pas afficher les infos satellite (nationalités et clubs) > Fait
