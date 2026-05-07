import requests
import json
import time
import os

API = "http://localhost:8000"
CACHE_DIR = "cache"
SEASONS = ["2025"]
COMPETITION = "FR1"

os.makedirs(CACHE_DIR, exist_ok=True)

def get(url, cache_key):
    path = f"{CACHE_DIR}/{cache_key}.json"
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    for attempt in range(3):
        try:
            time.sleep(1)
            r = requests.get(url, timeout=60)
            if r.status_code != 200:
                print(f"  ERREUR {r.status_code} : {url}")
                return None
            data = r.json()
            with open(path, "w") as f:
                json.dump(data, f)
            return data
        except requests.exceptions.Timeout:
            print(f"  Timeout (tentative {attempt+1}/3) : {url}")
            time.sleep(5 * (attempt + 1))
        except Exception as e:
            print(f"  Erreur : {e}")
            return None
    return None

# 1. Collecter tous les clubs L1 sur toutes les saisons
print("=== Collecte des clubs L1 ===")
all_clubs = {}  # id -> name

for season in SEASONS:
    data = get(f"{API}/competitions/{COMPETITION}/clubs?season_id={season}", f"clubs_{season}")
    if not data:
        continue
    clubs = data.get("clubs", [])
    for c in clubs:
        all_clubs[c["id"]] = c["name"]
    print(f"  {season}: {len(clubs)} clubs")

print(f"Total clubs uniques: {len(all_clubs)}\n")

# 2. Collecter tous les joueurs par club/saison
print("=== Collecte des joueurs ===")
all_player_ids = set()

for season in SEASONS:
    data = get(f"{API}/competitions/{COMPETITION}/clubs?season_id={season}", f"clubs_{season}")
    if not data:
        continue
    for club in data.get("clubs", []):
        cid = club["id"]
        players_data = get(f"{API}/clubs/{cid}/players?season_id={season}", f"players_{cid}_{season}")
        if not players_data:
            continue
        players = players_data.get("players", [])
        for p in players:
            all_player_ids.add(p["id"])
        print(f"  {club['name']} {season}: {len(players)} joueurs")

print(f"\nTotal joueurs uniques: {len(all_player_ids)}\n")

# 3. Pour chaque joueur, récupérer profil + transfers
print("=== Collecte des profils et transfers ===")
players_db = []

for i, pid in enumerate(sorted(all_player_ids)):
    if i % 50 == 0:
        print(f"  {i}/{len(all_player_ids)}...")

    profile = get(f"{API}/players/{pid}/profile", f"profile_{pid}")
    transfers = get(f"{API}/players/{pid}/transfers", f"transfers_{pid}")

    if not profile:
        continue

    nom = profile.get("name", "")
    nationalites = profile.get("citizenship", [])

    carriere = []
    if transfers:
        clubs_seen = set()
        for t in transfers.get("transfers", []):
            club_to = t.get("clubTo", {}).get("name", "")
            season_str = t.get("season", "")
            if club_to and club_to not in ("Retired", "Without Club", ""):
                # Convertir "23/24" -> 2023
                year = None
                if "/" in season_str:
                    try:
                        year = 2000 + int(season_str.split("/")[0])
                    except:
                        pass
                if club_to not in clubs_seen:
                    clubs_seen.add(club_to)
                    carriere.append({"club": club_to, "annee_debut": year, "annee_fin": None})

    players_db.append({
        "id": pid,
        "nom": nom,
        "nationalites": nationalites,
        "carriere": carriere
    })

# 4. Sauvegarder
output = f"players_raw.json"
with open(output, "w", encoding="utf-8") as f:
    json.dump(players_db, f, ensure_ascii=False, indent=2)

print(f"\n=== Terminé ===")
print(f"{len(players_db)} joueurs exportés dans {output}")
