import type { Database } from "@/lib/supabase/database.types";
import type { Mode } from "@/game/types";

export type DbPuzzleMode = Database["public"]["Enums"]["puzzle_mode"];

export function dbModeToAppMode(mode: DbPuzzleMode): Mode {
  if (mode === "club_club") {
    return "cc";
  }
  if (mode === "club_year") {
    return "ca";
  }
  return "cs";
}

export function appModeToDbMode(mode: Mode): DbPuzzleMode {
  if (mode === "cc") {
    return "club_club";
  }
  if (mode === "ca") {
    return "club_year";
  }
  return "club_nationality";
}
