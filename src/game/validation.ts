import type { AxisType, Player, Puzzle } from "./types";

type ValidateAnswerInput = {
  puzzle: Puzzle;
  players: Player[];
  key: string;
  row: string | number;
  col: string | number;
  rowType: AxisType;
  colType: AxisType;
  playerName: string;
};

export function validateAnswer(input: ValidateAnswerInput) {
  const explicitSolutions = input.puzzle.solutions[input.key] ?? [];
  if (explicitSolutions.includes(input.playerName)) {
    return true;
  }

  const player = input.players.find((candidate) => candidate.nom === input.playerName);
  if (!player) {
    return false;
  }

  if (input.colType === "annee") {
    return player.carriere.some((spell) => {
      if (spell.club !== input.row) {
        return false;
      }

      const year = Number(input.col);
      return spell.annee_debut <= year && (spell.annee_fin === null || spell.annee_fin > year);
    });
  }

  if (input.colType === "sel") {
    return player.clubs.includes(String(input.row)) && player.sels.includes(String(input.col));
  }

  return player.clubs.includes(String(input.row)) && player.clubs.includes(String(input.col));
}
