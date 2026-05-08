import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SOURCE_SLUG = "prototype-l1-2025-26";
const SOURCE_NAME = "Prototype L1 2025/26";
const SNAPSHOT_VERSION = "v1";
const SNAPSHOT_LABEL = "Prototype Ligue 1 2025/26";
const DRY_RUN = process.argv.includes("--dry-run");
const TODAY = new Date().toISOString().slice(0, 10);
const PUZZLE_DATE = process.env.PROTOTYPE_PUZZLE_DATE || TODAY;

loadEnvFile(".env.local");

const players = JSON.parse(await readFile("src/data/players.generated.json", "utf8"));
const puzzles = JSON.parse(await readFile("src/data/puzzles.generated.json", "utf8"));
const seedData = buildSeedData(players, puzzles);

console.log(
  JSON.stringify(
    {
      source: SOURCE_SLUG,
      snapshot: SNAPSHOT_VERSION,
      puzzleDate: PUZZLE_DATE,
      dryRun: DRY_RUN,
      countries: seedData.countries.length,
      clubs: seedData.clubs.length,
      players: seedData.players.length,
      careerSpells: seedData.careerSpells.length,
      puzzleModes: Object.keys(puzzles).length,
      missingExplicitAnswers: seedData.missingAnswers.length
    },
    null,
    2
  )
);

if (seedData.missingAnswers.length) {
  console.warn("Some explicit puzzle answers are not present in players.generated.json:");
  for (const missing of seedData.missingAnswers.slice(0, 25)) {
    console.warn(`  - ${missing.mode} ${missing.cellKey}: ${missing.playerName}`);
  }
  if (seedData.missingAnswers.length > 25) {
    console.warn(`  ...and ${seedData.missingAnswers.length - 25} more`);
  }
}

if (DRY_RUN) {
  process.exit(0);
}

const supabase = createAdminClient();

const source = await upsertSingle("data_sources", {
  name: SOURCE_NAME,
  slug: SOURCE_SLUG,
  provider_url: null,
  license_note: "Prototype data generated from the forked single-file app. Replace before production use."
});

let snapshot = await getSnapshot(source.id);
if (!snapshot) {
  snapshot = await insertSingle("data_snapshots", {
    source_id: source.id,
    label: SNAPSHOT_LABEL,
    version: SNAPSHOT_VERSION,
    status: "importing",
    notes: "Disposable prototype snapshot for app development."
  });
} else {
  snapshot = await updateSingle("data_snapshots", snapshot.id, {
    label: SNAPSHOT_LABEL,
    status: "importing",
    notes: "Disposable prototype snapshot for app development."
  });
}

await clearSnapshot(snapshot.id);

const countryRows = await insertMany(
  "countries",
  seedData.countries.map((country) => ({
    name: country.name,
    slug: country.slug,
    external_id: country.externalId,
    data_snapshot_id: snapshot.id
  }))
);
const countryIdByName = new Map(countryRows.map((row) => [row.name, row.id]));

const clubRows = await insertMany(
  "clubs",
  seedData.clubs.map((club) => ({
    name: club.name,
    slug: club.slug,
    external_id: club.externalId,
    data_snapshot_id: snapshot.id
  }))
);
const clubIdByName = new Map(clubRows.map((row) => [row.name, row.id]));

const playerRows = await insertMany(
  "players",
  seedData.players.map((player) => ({
    display_name: player.name,
    slug: player.slug,
    external_id: player.externalId,
    data_snapshot_id: snapshot.id
  }))
);
const playerIdByName = new Map(playerRows.map((row) => [row.display_name, row.id]));

await insertMany(
  "player_nationalities",
  seedData.playerNationalities.map((entry) => ({
    player_id: mustGet(playerIdByName, entry.playerName, "player"),
    country_id: mustGet(countryIdByName, entry.countryName, "country"),
    is_primary: entry.isPrimary
  }))
);

await insertMany(
  "career_spells",
  seedData.careerSpells.map((spell) => ({
    player_id: mustGet(playerIdByName, spell.playerName, "player"),
    club_id: mustGet(clubIdByName, spell.clubName, "club"),
    season_start: spell.seasonStart,
    season_end: spell.seasonEnd,
    is_loan: false,
    source: SOURCE_SLUG,
    source_ref: spell.externalId,
    external_id: spell.externalId,
    data_snapshot_id: snapshot.id
  }))
);

for (const [modeKey, puzzle] of Object.entries(puzzles)) {
  await insertPuzzle({ modeKey, puzzle, snapshotId: snapshot.id, clubIdByName, countryIdByName, playerIdByName });
}

await updateSingle("data_snapshots", snapshot.id, {
  status: "active",
  imported_at: new Date().toISOString()
});

console.log("Prototype Supabase seed complete.");

function buildSeedData(playerData, puzzleData) {
  const countryNames = new Set();
  const clubNames = new Set();
  const playerRows = [];
  const playerNationalities = [];
  const careerSpells = [];
  const missingAnswers = [];

  const uniquePlayers = uniqueBy(playerData, (player) => player.nom);
  const playerNames = new Set(uniquePlayers.map((player) => player.nom));

  for (const player of uniquePlayers) {
    playerRows.push({
      name: player.nom,
      slug: uniqueSlug(player.nom, playerRows.map((row) => row.slug)),
      externalId: stableExternalId("player", player.nom)
    });

    for (const [index, countryName] of (player.sels || []).entries()) {
      countryNames.add(countryName);
      playerNationalities.push({
        playerName: player.nom,
        countryName,
        isPrimary: index === 0
      });
    }

    for (const [index, spell] of (player.carriere || []).entries()) {
      clubNames.add(spell.club);
      careerSpells.push({
        playerName: player.nom,
        clubName: spell.club,
        seasonStart: spell.annee_debut,
        seasonEnd: spell.annee_fin,
        externalId: stableExternalId("spell", `${player.nom}-${spell.club}-${spell.annee_debut}-${index}`)
      });
    }
  }

  for (const puzzle of Object.values(puzzleData)) {
    for (const value of puzzle.rows) {
      if (puzzle.rowType === "club") {
        clubNames.add(String(value));
      }
      if (puzzle.rowType === "sel") {
        countryNames.add(String(value));
      }
    }
    for (const value of puzzle.cols) {
      if (puzzle.colType === "club") {
        clubNames.add(String(value));
      }
      if (puzzle.colType === "sel") {
        countryNames.add(String(value));
      }
    }
  }

  for (const [mode, puzzle] of Object.entries(puzzleData)) {
    for (const [cellKey, names] of Object.entries(puzzle.solutions || {})) {
      for (const playerName of names) {
        if (!playerNames.has(playerName)) {
          missingAnswers.push({ mode, cellKey, playerName });
        }
      }
    }
  }

  return {
    countries: [...countryNames].sort(localeCompare).map((name) => ({
      name,
      slug: slugify(name),
      externalId: stableExternalId("country", name)
    })),
    clubs: [...clubNames].sort(localeCompare).map((name) => ({
      name,
      slug: slugify(name),
      externalId: stableExternalId("club", name)
    })),
    players: playerRows,
    playerNationalities,
    careerSpells,
    missingAnswers
  };
}

async function insertPuzzle({ modeKey, puzzle, snapshotId, clubIdByName, countryIdByName, playerIdByName }) {
  const mode = mapPuzzleMode(modeKey);
  const puzzleRow = await insertSingle("puzzles", {
    mode,
    status: "published",
    puzzle_date: PUZZLE_DATE,
    seed: `${SOURCE_SLUG}-${SNAPSHOT_VERSION}-${modeKey}`,
    title: `${SNAPSHOT_LABEL} - ${modeKey.toUpperCase()}`,
    generated_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    data_snapshot_id: snapshotId
  });

  await insertMany("puzzle_axes", [
    ...puzzle.rows.map((value, position) => buildAxisRow(puzzleRow.id, "row", position, puzzle.rowType, value, clubIdByName, countryIdByName)),
    ...puzzle.cols.map((value, position) => buildAxisRow(puzzleRow.id, "col", position, puzzle.colType, value, clubIdByName, countryIdByName))
  ]);

  for (const [rowPosition, row] of puzzle.rows.entries()) {
    for (const [colPosition, col] of puzzle.cols.entries()) {
      const key = `${row}-${col}`;
      const answerNames = puzzle.solutions[key] || [];
      const knownAnswerNames = answerNames.filter((name) => playerIdByName.has(name));
      const cell = await insertSingle("puzzle_cells", {
        puzzle_id: puzzleRow.id,
        row_position: rowPosition,
        col_position: colPosition,
        answer_count: knownAnswerNames.length,
        rarity_score: knownAnswerNames.length ? Number((1 / knownAnswerNames.length).toFixed(4)) : null
      });

      await insertMany(
        "accepted_answers",
        knownAnswerNames.map((playerName, index) => ({
          puzzle_cell_id: cell.id,
          player_id: mustGet(playerIdByName, playerName, "player"),
          is_featured: index === 0
        }))
      );
    }
  }
}

function buildAxisRow(puzzleId, axis, position, axisType, value, clubIdByName, countryIdByName) {
  if (axisType === "club") {
    return {
      puzzle_id: puzzleId,
      axis,
      position,
      kind: "club",
      club_id: mustGet(clubIdByName, String(value), "club"),
      label: String(value)
    };
  }

  if (axisType === "sel") {
    return {
      puzzle_id: puzzleId,
      axis,
      position,
      kind: "country",
      country_id: mustGet(countryIdByName, String(value), "country"),
      label: String(value)
    };
  }

  return {
    puzzle_id: puzzleId,
    axis,
    position,
    kind: "year",
    season_start: Number(value),
    season_end: Number(value),
    label: `${value}/${String(Number(value) + 1).slice(2)}`
  };
}

async function clearSnapshot(snapshotId) {
  const { data: snapshotPuzzles, error: puzzleListError } = await supabase
    .from("puzzles")
    .select("id")
    .eq("data_snapshot_id", snapshotId);
  throwIfError(puzzleListError, "list snapshot puzzles");

  for (const puzzle of snapshotPuzzles || []) {
    await deleteWhere("puzzles", "id", puzzle.id);
  }

  const { data: snapshotPlayers, error: playerListError } = await supabase
    .from("players")
    .select("id")
    .eq("data_snapshot_id", snapshotId);
  throwIfError(playerListError, "list snapshot players");

  for (const chunk of chunks((snapshotPlayers || []).map((player) => player.id), 200)) {
    if (chunk.length) {
      const { error } = await supabase.from("player_nationalities").delete().in("player_id", chunk);
      throwIfError(error, "delete player nationalities");
    }
  }

  await deleteWhere("career_spells", "data_snapshot_id", snapshotId);
  await deleteWhere("players", "data_snapshot_id", snapshotId);
  await deleteWhere("clubs", "data_snapshot_id", snapshotId);
  await deleteWhere("countries", "data_snapshot_id", snapshotId);
}

async function getSnapshot(sourceId) {
  const { data, error } = await supabase
    .from("data_snapshots")
    .select("*")
    .eq("source_id", sourceId)
    .eq("version", SNAPSHOT_VERSION)
    .maybeSingle();
  throwIfError(error, "get data snapshot");
  return data;
}

async function insertSingle(table, row) {
  const { data, error } = await supabase.from(table).insert(row).select("*").single();
  throwIfError(error, `insert ${table}`);
  return data;
}

async function updateSingle(table, id, row) {
  const { data, error } = await supabase.from(table).update(row).eq("id", id).select("*").single();
  throwIfError(error, `update ${table}`);
  return data;
}

async function upsertSingle(table, row) {
  const { data, error } = await supabase.from(table).upsert(row, { onConflict: "slug" }).select("*").single();
  throwIfError(error, `upsert ${table}`);
  return data;
}

async function insertMany(table, rows) {
  if (!rows.length) {
    return [];
  }

  const inserted = [];
  for (const chunk of chunks(rows, 500)) {
    const { data, error } = await supabase.from(table).insert(chunk).select("*");
    throwIfError(error, `insert ${table}`);
    inserted.push(...(data || []));
  }
  return inserted;
}

async function deleteWhere(table, column, value) {
  const { error } = await supabase.from(table).delete().eq(column, value);
  throwIfError(error, `delete ${table}`);
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function loadEnvFile(path) {
  try {
    const env = readFileSync(path, "utf8");
    for (const line of env.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separator = trimmed.indexOf("=");
      if (separator === -1) {
        continue;
      }
      const key = trimmed.slice(0, separator).trim();
      const rawValue = trimmed.slice(separator + 1).trim();
      process.env[key] ||= rawValue.replace(/^["']|["']$/g, "");
    }
  } catch {
    // The caller will get a clearer missing-env error if this file is absent.
  }
}

function mapPuzzleMode(mode) {
  if (mode === "cc") {
    return "club_club";
  }
  if (mode === "ca") {
    return "club_year";
  }
  if (mode === "cs") {
    return "club_nationality";
  }
  throw new Error(`Unknown puzzle mode: ${mode}`);
}

function mustGet(map, key, label) {
  const value = map.get(key);
  if (!value) {
    throw new Error(`Missing ${label}: ${key}`);
  }
  return value;
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }
  return result;
}

function uniqueSlug(value, existingSlugs) {
  const existing = new Set(existingSlugs);
  const base = slugify(value);
  let slug = base;
  let index = 2;
  while (existing.has(slug)) {
    slug = `${base}-${index}`;
    index += 1;
  }
  return slug;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function stableExternalId(prefix, value) {
  return `${prefix}:${slugify(value)}`;
}

function chunks(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function localeCompare(a, b) {
  return a.localeCompare(b, "fr");
}

function throwIfError(error, action) {
  if (error) {
    throw new Error(`Failed to ${action}: ${error.message}`);
  }
}
