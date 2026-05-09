import type { GameState, Mode, Puzzle } from "./types";

const MODE_MULTIPLIERS: Record<Mode, number> = {
  cc: 1.5,
  ca: 2,
  cs: 1
};

export function calculateScore(mode: Mode, puzzle: Puzzle, state: GameState) {
  const baseScore = Object.keys(state.cellules).reduce((score, key) => {
    if (!state.cellules[key]?.remplie) {
      return score;
    }

    const solutions = puzzle.solutions[key] ?? [];
    return score + (solutions.length <= 2 ? 100 : 50);
  }, 0);

  const multiplied = Math.round(baseScore * MODE_MULTIPLIERS[mode]);
  return Math.max(0, multiplied - state.erreurs * 20);
}
