import { describe, expect, it } from "vitest";
import playersData from "@/data/players.generated.json";
import puzzlesData from "@/data/puzzles.generated.json";
import { cellKey } from "@/game/keys";
import { searchPlayers } from "@/game/search";
import { calculateScore } from "@/game/scoring";
import { createInitialState } from "@/game/state";
import type { Player, PuzzlesByMode } from "@/game/types";
import { validateAnswer } from "@/game/validation";

const players = playersData as Player[];
const puzzles = puzzlesData as PuzzlesByMode;

describe("game engine", () => {
  it("validates explicit club x club solutions", () => {
    const puzzle = puzzles.cc;
    const key = cellKey("Lyon", "Rennes");

    expect(
      validateAnswer({
        puzzle,
        players,
        key,
        row: "Lyon",
        col: "Rennes",
        rowType: "club",
        colType: "club",
        playerName: "Amine Gouiri"
      })
    ).toBe(true);
  });

  it("rejects an invalid player for a cell", () => {
    const puzzle = puzzles.cc;
    const key = cellKey("Lyon", "Rennes");

    expect(
      validateAnswer({
        puzzle,
        players,
        key,
        row: "Lyon",
        col: "Rennes",
        rowType: "club",
        colType: "club",
        playerName: "Olivier Giroud"
      })
    ).toBe(false);
  });

  it("searches without accents", () => {
    const matches = searchPlayers(players, "jeremy");

    expect(matches[0]?.nom).toBe("Jérémy Jacquet");
  });

  it("scores filled cells with mode multiplier and error penalty", () => {
    const puzzle = puzzles.cc;
    const state = createInitialState(puzzle);
    state.cellules[cellKey("Lyon", "Rennes")] = { remplie: true, joueur: "Amine Gouiri" };
    state.erreurs = 1;

    expect(calculateScore("cc", puzzle, state)).toBe(55);
  });
});
