import { cellKey } from "@/game/keys";
import type { GameState, Puzzle } from "@/game/types";
import HeaderCell from "./HeaderCell";
import type { ActiveCell } from "./types";

type GameGridProps = {
  puzzle: Puzzle;
  state: GameState;
  onCell: (cell: ActiveCell) => void;
};

export default function GameGrid({ puzzle, state, onCell }: GameGridProps) {
  return (
    <div className="grid-container">
      <div className="corner" />
      {puzzle.cols.map((col) => (
        <HeaderCell key={String(col)} value={col} type={puzzle.colType} isRow={false} />
      ))}
      {puzzle.rows.map((row) => (
        <div className="grid-row-fragment" key={String(row)}>
          <HeaderCell value={row} type={puzzle.rowType} isRow />
          {puzzle.cols.map((col) => {
            const key = cellKey(row, col);
            const cell = state.cellules[key];
            const solutions = puzzle.solutions[key] ?? [];
            const rare = solutions.length <= 2;

            return (
              <button
                key={key}
                className={`cell ${cell?.remplie ? "filled" : ""} ${state.termine && !cell?.remplie ? "locked" : ""}`}
                disabled={state.termine || cell?.remplie}
                onClick={() => onCell({ key, row, col, rowType: puzzle.rowType, colType: puzzle.colType })}
              >
                {cell?.remplie ? (
                  <>
                    <span className="cell-content pop">
                      <span className="cell-player">{cell.joueur}</span>
                      <span className="cell-sub">
                        {row} x {col}
                      </span>
                    </span>
                    {rare ? <span className="rarity rare">Rare</span> : null}
                  </>
                ) : state.termine ? (
                  <span className="cell-content">
                    <span className="cell-player muted">{solutions[0] ?? "?"}</span>
                  </span>
                ) : (
                  <span className="cell-icon">+</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
