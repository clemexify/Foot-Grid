import { MAX_ERRORS, MODE_INFO } from "./constants";
import { cellKey } from "./keys";
import { calculateScore } from "./scoring";
import type { GameState, Mode, Puzzle } from "./types";

export function buildShareText(mode: Mode, puzzle: Puzzle, state: GameState, date = new Date()) {
  const formattedDate = date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const modeInfo = MODE_INFO[mode];
  let grid = "";

  puzzle.rows.forEach((row) => {
    puzzle.cols.forEach((col) => {
      grid += state.cellules[cellKey(row, col)]?.remplie ? "🟢" : "⬛";
    });
    grid += "\n";
  });

  return `${modeInfo.emoji} Foot Grid L1 25/26 - ${formattedDate}
Mode : ${modeInfo.label}
${grid}✅ ${state.trouves}/9 trouvés
❌ ${state.erreurs}/${MAX_ERRORS} erreurs
🏆 ${calculateScore(mode, puzzle, state)} pts

joue sur footgrid.fr`;
}
