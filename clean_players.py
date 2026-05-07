import json
import re

# Clubs L1 : noms canoniques pour le jeu
CLUBS_L1 = {
    "PSG": "PSG",
    "Paris SG": "PSG",
    "Paris Saint-Germain": "PSG",
    "Lyon": "Lyon",
    "Olympique Lyon": "Lyon",
    "Olymp. Lyon": "Lyon",
    "Marseille": "Marseille",
    "Olympique Marseille": "Marseille",
    "Monaco": "Monaco",
    "AS Monaco": "Monaco",
    "Lille": "LOSC",
    "LOSC Lille": "LOSC",
    "LOSC": "LOSC",
    "Stade Rennais": "Rennes",
    "Stade Rennais FC": "Rennes",
    "Nice": "Nice",
    "OGC Nice": "Nice",
    "Nizza": "Nice",
    "Lens": "RC Lens",
    "RC Lens": "RC Lens",
    "R. Strasbourg": "Strasbourg",
    "RC Strasbourg Alsace": "Strasbourg",
    "RC Strasbourg": "Strasbourg",
    "Toulouse": "Toulouse",
    "FC Toulouse": "Toulouse",
    "FC Nantes": "Nantes",
    "Nantes": "Nantes",
    "Stade Brestois": "Brest",
    "Stade Brestois 29": "Brest",
    "AJ Auxerre": "Auxerre",
    "Le Havre AC": "Le Havre",
    "Le Havre": "Le Havre",
    "FC Metz": "Metz",
    "Metz": "Metz",
    "FC Lorient": "Lorient",
    "Lorient": "Lorient",
    "Angers SCO": "Angers",
    "Angers": "Angers",
    "Paris FC": "Paris FC",
    "Stade Reims": "Reims",
    "Saint-Étienne": "Saint-Étienne",
    "AS Saint-Étienne": "Saint-Étienne",
    "Montpellier": "Montpellier",
    "Montpellier HSC": "Montpellier",
    "G. Bordeaux": "Bordeaux",
    "FC Girondins Bordeaux": "Bordeaux",
    "SM Caen": "Caen",
    "Stade Malherbe Caen": "Caen",
    "Dijon": "Dijon",
    "Dijon FCO": "Dijon",
    "Troyes": "Troyes",
    "ESTAC Troyes": "Troyes",
    "Guingamp": "Guingamp",
    "EA Guingamp": "Guingamp",
    "AC Ajaccio": "Ajaccio",
    "Amiens SC": "Amiens",
    "AS Nancy": "Nancy",
    "Rodez AF": "Rodez",
    "Clermont Foot": "Clermont",
    "Clermont Foot 63": "Clermont",
    "FC Annecy": "Annecy",
    "Pau FC": "Pau",
    "Valenciennes FC": "Valenciennes",
    "Stade Lavallois": "Laval",
    "USL Dunkerque": "Dunkerque",
}

# Autres clubs notables (pour les carrières)
CLUBS_AUTRES = {
    "Chelsea": "Chelsea",
    "Arsenal": "Arsenal",
    "Liverpool": "Liverpool",
    "Manchester City": "Man City",
    "Man City": "Man City",
    "Manchester United": "Man United",
    "Man United": "Man United",
    "Newcastle": "Newcastle",
    "Tottenham": "Tottenham",
    "Brighton": "Brighton",
    "Southampton": "Southampton",
    "Aston Villa": "Aston Villa",
    "West Ham": "West Ham",
    "Everton": "Everton",
    "Fulham": "Fulham",
    "Brentford": "Brentford",
    "Leicester": "Leicester",
    "Nottingham Forest": "Nottm Forest",
    "Bayern Munich": "Bayern",
    "Bayern": "Bayern",
    "Dortmund": "Dortmund",
    "Borussia Dortmund": "Dortmund",
    "Frankfurt": "Eintracht",
    "Eintracht Frankfurt": "Eintracht",
    "Leverkusen": "Leverkusen",
    "Bayer Leverkusen": "Leverkusen",
    "FC Schalke 04": "Schalke",
    "Wolfsburg": "Wolfsburg",
    "RB Leipzig": "Leipzig",
    "Barcelona": "Barcelone",
    "Barcelone": "Barcelone",
    "Real Madrid": "Real Madrid",
    "Atletico Madrid": "Atletico",
    "Atletico": "Atletico",
    "Sevilla FC": "Séville",
    "Séville": "Séville",
    "Valencia CF": "Valence",
    "Athletic Bilbao": "Athletic",
    "Villarreal": "Villarreal",
    "Real Betis": "Betis",
    "Juventus": "Juventus",
    "Inter": "Inter",
    "Milan": "Milan",
    "AC Milan": "Milan",
    "Roma": "Roma",
    "AS Roma": "Roma",
    "Naples": "Naples",
    "Napoli": "Naples",
    "Lazio": "Lazio",
    "Fiorentina": "Fiorentina",
    "Atalanta": "Atalanta",
    "Porto": "Porto",
    "Benfica": "Benfica",
    "Sporting CP": "Sporting",
    "Ajax": "Ajax",
    "PSV Eindhoven": "PSV",
    "PSV": "PSV",
    "Feyenoord": "Feyenoord",
    "Club Brugge": "Bruges",
    "Anderlecht": "Anderlecht",
    "Royal Antwerp": "Antwerp",
    "Cercle Brugge": "Cercle Brugge",
    "R Charleroi SC": "Charleroi",
    "Standard Liège": "Standard",
    "KAA Gent": "Gent",
    "Salzburg": "Salzbourg",
    "Red Bull Salzburg": "Salzbourg",
    "FC Liefering": "Liefering",
    "Olympiacos": "Olympiakos",
    "Nordsjaelland": "Nordsjaelland",
    "Lausanne-Sport": "Lausanne",
    "FC St. Gallen": "St. Gallen",
    "Sporting U17": None,
    "Sporting U19": None,
    "Génération Foot": "Génération Foot",
    "RFC Seraing": "Seraing",
    "Tours FC": "Tours",
    "Stade Lavallois": "Laval",
    "Famalicão": "Famalicão",
}

# Fusion des deux mappings
CLUBS_MAP = {**CLUBS_L1, **CLUBS_AUTRES}

# Nationalités EN -> FR
NATS_MAP = {
    "France": "France",
    "Senegal": "Sénégal",
    "Cote d'Ivoire": "Côte d'Ivoire",
    "DR Congo": "RD Congo",
    "Mali": "Mali",
    "Cameroon": "Cameroun",
    "Morocco": "Maroc",
    "Algeria": "Algérie",
    "Portugal": "Portugal",
    "Belgium": "Belgique",
    "England": "Angleterre",
    "Brazil": "Brésil",
    "Ghana": "Ghana",
    "Italy": "Italie",
    "Spain": "Espagne",
    "Nigeria": "Nigeria",
    "Guinea": "Guinée",
    "Netherlands": "Pays-Bas",
    "Guadeloupe": "Guadeloupe",
    "Argentina": "Argentine",
    "Martinique": "Martinique",
    "Poland": "Pologne",
    "Togo": "Togo",
    "Switzerland": "Suisse",
    "Denmark": "Danemark",
    "Norway": "Norvège",
    "United States": "États-Unis",
    "Haiti": "Haïti",
    "Germany": "Allemagne",
    "Sweden": "Suède",
    "Congo": "Congo",
    "Georgia": "Géorgie",
    "Jamaica": "Jamaïque",
    "Comoros": "Comores",
    "Burkina Faso": "Burkina Faso",
    "Gabon": "Gabon",
    "Mauritania": "Mauritanie",
    "Central African Republic": "Centrafrique",
    "Ukraine": "Ukraine",
    "Finland": "Finlande",
    "Slovakia": "Slovaquie",
    "Guinea-Bissau": "Guinée-Bissau",
    "Ireland": "Irlande",
    "Canada": "Canada",
    "French Guiana": "Guyane",
    "Sierra Leone": "Sierra Leone",
    "Ecuador": "Équateur",
    "Hungary": "Hongrie",
    "Japan": "Japon",
    "Serbia": "Serbie",
    "Tunisia": "Tunisie",
    "Burundi": "Burundi",
    "Russia": "Russie",
    "Réunion": "La Réunion",
    "Egypt": "Égypte",
    "Czech Republic": "Tchéquie",
    "Madagascar": "Madagascar",
    "Philippines": "Philippines",
    "Thailand": "Thaïlande",
    "Tanzania": "Tanzanie",
    "Angola": "Angola",
    "Croatia": "Croatie",
    "Benin": "Bénin",
    "Indonesia": "Indonésie",
    "New Zealand": "Nouvelle-Zélande",
    "The Gambia": "Gambie",
    "Colombia": "Colombie",
    "Türkiye": "Turquie",
    "Turkey": "Turquie",
    "Chile": "Chili",
    "Lebanon": "Liban",
    "Zimbabwe": "Zimbabwe",
    "Curacao": "Curaçao",
    "Venezuela": "Venezuela",
    "Sao Tome and Principe": "São Tomé-et-Príncipe",
    "Jordan": "Jordanie",
    "Korea, South": "Corée du Sud",
    "Suriname": "Suriname",
    "Saudi Arabia": "Arabie saoudite",
    "Iceland": "Islande",
    "Austria": "Autriche",
    "Paraguay": "Paraguay",
    "Greece": "Grèce",
    "Bosnia-Herzegovina": "Bosnie",
    "Libya": "Libye",
    "Montenegro": "Monténégro",
    "Costa Rica": "Costa Rica",
    "Scotland": "Écosse",
    "Wales": "Pays de Galles",
    "Luxembourg": "Luxembourg",
    "Uzbekistan": "Ouzbékistan",
    "Albania": "Albanie",
    "North Macedonia": "Macédoine du Nord",
    "Cape Verde": "Cap-Vert",
    "Rwanda": "Rwanda",
}

YOUTH_KEYWORDS = [
    r'\bU\d{2}\b', r'\bYouth\b', r'\bYth\b', r'Jugend', r'\bB\b$',
    r' B$', r'Youth$', r'Reserve', r'Sub-\d+', r'Reserv',
    r'U-\d+', r' II$', r'Espoirs'
]
YOUTH_RE = re.compile('|'.join(YOUTH_KEYWORDS), re.IGNORECASE)

def is_youth(club_name):
    return bool(YOUTH_RE.search(club_name))

def normalize_club(name):
    if is_youth(name):
        return None
    if name in CLUBS_MAP:
        return CLUBS_MAP[name]
    return name  # Garder tel quel si inconnu

def normalize_nat(name):
    return NATS_MAP.get(name, name)


with open('players_raw.json') as f:
    raw = json.load(f)

cleaned = []
for p in raw:
    # Nationalités traduites (filtrer DOM/territoires si souhaité)
    nats = [normalize_nat(n) for n in p['nationalites']]
    nats = [n for n in nats if n]

    # Carrière : filtrer jeunes, normaliser noms, dédupliquer
    carriere = []
    seen_clubs = set()
    for entry in p['carriere']:
        club = normalize_club(entry['club'])
        if club is None:
            continue
        if club in seen_clubs:
            continue
        seen_clubs.add(club)
        carriere.append({
            "club": club,
            "annee_debut": entry['annee_debut'],
            "annee_fin": entry['annee_fin'],
        })

    # Calculer annee_fin : le joueur est arrivé dans club[i] l'année X
    # → club[i-1] s'est terminé à X (les transfers sont du + récent au + ancien)
    for i in range(len(carriere) - 1):
        if carriere[i]['annee_debut'] is not None:
            carriere[i + 1]['annee_fin'] = carriere[i]['annee_debut']

    if not carriere:
        continue

    cleaned.append({
        "id": p['id'],
        "nom": p['nom'],
        "nationalites": nats,
        "carriere": carriere,
    })

with open('players_clean.json', 'w', encoding='utf-8') as f:
    json.dump(cleaned, f, ensure_ascii=False, indent=2)

# Stats
total = len(cleaned)
print(f"Joueurs : {total}")
print(f"Clubs inconnus (non mappés) :")
unknown = set()
for p in cleaned:
    for c in p['carriere']:
        if c['club'] not in set(CLUBS_MAP.values()) and c['club'] not in CLUBS_MAP:
            unknown.add(c['club'])
for u in sorted(unknown)[:40]:
    print(f"  {u}")
print(f"  ... ({len(unknown)} clubs non mappés au total)")
