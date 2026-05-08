"use client";

import { useMemo, useState } from "react";
import playersData from "@/data/players.generated.json";
import puzzlesData from "@/data/puzzles.generated.json";
import { CLUB_LOGOS, FLAGS, MAX_ERRORS, MODE_INFO } from "@/game/constants";
import { cellKey } from "@/game/keys";
import { searchPlayers } from "@/game/search";
import { calculateScore } from "@/game/scoring";
import { buildShareText } from "@/game/share";
import { createInitialState } from "@/game/state";
import type { AxisType, GameState, Mode, Player, Puzzle, PuzzlesByMode } from "@/game/types";
import { validateAnswer } from "@/game/validation";

const players = playersData as Player[];
const puzzles = puzzlesData as PuzzlesByMode;

type ActiveCell = {
  key: string;
  row: string | number;
  col: string | number;
  rowType: AxisType;
  colType: AxisType;
};

function Header({ score, found, inGame }: { score: number; found: number; inGame: boolean }) {
  const date = useMemo(
    () => new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
    []
  );

  return (
    <header>
      <div className="logo">
        <span className="logo-l1">Foot</span> Grid
      </div>
      <div className="subtitle">
        Joueurs de <span>Ligue 1 saison 2025/26</span>
      </div>
      <div className="date-badge">{date}</div>
      {inGame ? (
        <div className="score-header">
          <div className="score-item">
            <div className="score-num">{score}</div>
            <div className="score-label">Score</div>
          </div>
          <div className="score-item">
            <div className="score-num">{found}/9</div>
            <div className="score-label">Trouvés</div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function ModePicker({ onStart }: { onStart: (mode: Mode) => void }) {
  return (
    <div>
      <div className="mode-title">Choisir un mode</div>
      <div className="mode-cards">
        <button className="mode-card cc" onClick={() => onStart("cc")}>
          <span className="mode-header">
            <span className="mode-name">🏟️ Club x Club</span>
            <span className="mode-tag">Carrière</span>
          </span>
          <span className="mode-desc">
            Trouve un joueur L1 25/26 ayant joué dans les <strong>deux clubs</strong> au cours de sa carrière.
          </span>
          <span className="mode-ex">
            <span className="ex-b">Lyon</span>
            <span>x</span>
            <span className="ex-b">Nice</span>
            <span>→ Amine Gouiri...</span>
          </span>
        </button>
        <button className="mode-card ca" onClick={() => onStart("ca")}>
          <span className="mode-header">
            <span className="mode-name">📅 Club x Année</span>
            <span className="mode-tag">Historique</span>
          </span>
          <span className="mode-desc">
            Trouve un joueur L1 25/26 qui était dans le <strong>club indiqué</strong> lors de la{" "}
            <strong>saison indiquée</strong>.
          </span>
          <span className="mode-ex">
            <span className="ex-b">PSG</span>
            <span>x</span>
            <span className="ex-b">2022/23</span>
            <span>→ Hakimi, Vitinha...</span>
          </span>
        </button>
        <button className="mode-card cs" onClick={() => onStart("cs")}>
          <span className="mode-header">
            <span className="mode-name">⚽ Club x Sélection</span>
            <span className="mode-tag">Nationalité</span>
          </span>
          <span className="mode-desc">
            Trouve un joueur ayant joué dans le <strong>club</strong> ET dont la nationalité correspond à la{" "}
            <strong>sélection</strong>.
          </span>
          <span className="mode-ex">
            <span className="ex-b">Le Havre</span>
            <span>x</span>
            <span className="ex-b">🇸🇳 Sénégal</span>
            <span>→ Fodé Ballo-Touré...</span>
          </span>
        </button>
      </div>
    </div>
  );
}

function HeaderCell({ value, type, isRow }: { value: string | number; type: AxisType; isRow: boolean }) {
  const base = isRow ? "row-header" : "col-header";
  if (type === "sel") {
    return (
      <div className={`${base} sel`}>
        <div className="sel-flag">{FLAGS[String(value)] ?? "🏳️"}</div>
        <div className="sel-name">{value}</div>
      </div>
    );
  }

  if (type === "annee") {
    const year = Number(value);
    return (
      <div className={`${base} annee`}>
        <div className="year-num">{year}</div>
        <div className="year-sub">/{String(year + 1).slice(2)}</div>
      </div>
    );
  }

  return (
    <div className={`${base} club`}>
      <div className="club-logo">{CLUB_LOGOS[String(value)] ?? "⚽"}</div>
      <div className="club-name">{value}</div>
    </div>
  );
}

function SearchModal({
  activeCell,
  onClose,
  onSelect
}: {
  activeCell: ActiveCell;
  onClose: () => void;
  onSelect: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = searchPlayers(players, query);
  const rowLabel = formatCellHint(activeCell.row, activeCell.rowType);
  const colLabel = formatCellHint(activeCell.col, activeCell.colType);
  const hint =
    activeCell.rowType === "club" && activeCell.colType === "club"
      ? `A joué à ${rowLabel} ET à ${colLabel}`
      : activeCell.rowType === "club" && activeCell.colType === "annee"
        ? `Était à ${rowLabel} en saison ${colLabel}`
        : activeCell.rowType === "club" && activeCell.colType === "sel"
          ? `A joué à ${rowLabel} ET nationalité ${colLabel}`
          : `Nationalité ${rowLabel} ET a joué à ${colLabel}`;

  return (
    <div className="modal-overlay open" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <div className="modal">
        <div className="modal-title">Sélectionner un joueur</div>
        <div className="modal-hint">{hint}</div>
        <input
          autoFocus
          type="text"
          className="search-input"
          value={query}
          placeholder="NOM DU JOUEUR..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="suggestions">
          {query.length >= 2 && matches.length === 0 ? <div className="no-results">Aucun joueur trouvé...</div> : null}
          {matches.map((player) => (
            <button key={player.nom} className="sug-item" onClick={() => onSelect(player.nom)}>
              <span className="sug-name">{player.nom}</span>
            </button>
          ))}
        </div>
        <button className="modal-close" onClick={onClose}>
          ✕ Annuler
        </button>
      </div>
    </div>
  );
}

function formatCellHint(value: string | number, type: AxisType) {
  if (type === "sel") {
    return `${FLAGS[String(value)] ?? ""} ${value}`.trim();
  }
  if (type === "annee") {
    const year = Number(value);
    return `${year}/${String(year + 1).slice(2)}`;
  }
  return String(value);
}

function GameGrid({
  puzzle,
  state,
  onCell
}: {
  puzzle: Puzzle;
  state: GameState;
  onCell: (cell: ActiveCell) => void;
}) {
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

export default function FootGridApp() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [toast, setToast] = useState("");
  const [shareText, setShareText] = useState("");

  const puzzle = mode ? puzzles[mode] : null;
  const score = mode && puzzle && state ? calculateScore(mode, puzzle, state) : 0;

  function startGame(nextMode: Mode) {
    setMode(nextMode);
    setState(createInitialState(puzzles[nextMode]));
    setShareText("");
  }

  function backToMenu() {
    setMode(null);
    setState(null);
    setActiveCell(null);
    setShareText("");
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2000);
  }

  function selectPlayer(playerName: string) {
    if (!mode || !puzzle || !state || !activeCell) {
      return;
    }

    setActiveCell(null);
    const ok = validateAnswer({ puzzle, players, playerName, ...activeCell });
    const nextState: GameState = structuredClone(state);

    if (ok) {
      nextState.cellules[activeCell.key] = { remplie: true, joueur: playerName };
      nextState.trouves += 1;
      nextState.termine = nextState.trouves === 9;
      showToast("✅ Correct !");
    } else {
      nextState.erreurs += 1;
      nextState.termine = nextState.erreurs >= MAX_ERRORS;
      showToast("❌ Joueur invalide pour cette case");
    }

    setState(nextState);
    if (nextState.termine) {
      setShareText(buildShareText(mode, puzzle, nextState));
    }
  }

  async function shareResult() {
    if (!mode || !puzzle || !state) {
      return;
    }

    const text = buildShareText(mode, puzzle, state);
    setShareText(text);
    await navigator.clipboard?.writeText(text);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <main className="wrap">
      <Header score={score} found={state?.trouves ?? 0} inGame={Boolean(mode)} />
      {!mode || !puzzle || !state ? (
        <ModePicker onStart={startGame} />
      ) : (
        <section>
          <button className="back-btn" onClick={backToMenu}>
            ← Changer de mode
          </button>
          <div className="rules">
            <span>
              {mode === "cc" ? "Joueur ayant joué dans les deux clubs" : null}
              {mode === "ca" ? "Joueur L1 25/26 qui était dans ce club cette saison-là" : null}
              {mode === "cs" ? "Joueur ayant joué dans le club ET cette nationalité" : null}
              {" · "}
              <strong>{MAX_ERRORS} erreurs</strong> max
            </span>
            <span className={`mode-badge ${MODE_INFO[mode].cls}`}>{MODE_INFO[mode].label}</span>
          </div>
          <div className="errors-row">
            {Array.from({ length: MAX_ERRORS }).map((_, index) => (
              <span key={index} className={`error-dot ${index < state.erreurs ? "used" : ""}`} />
            ))}
          </div>
          <GameGrid puzzle={puzzle} state={state} onCell={setActiveCell} />
          {state.termine ? (
            <div className="end-screen show">
              <div className={`end-title ${state.trouves === 9 ? "win" : "lose"}`}>
                {state.trouves === 9 ? "BRAVO !" : "DOMMAGE"}
              </div>
              <div className="end-score">
                {MODE_INFO[mode].emoji} {MODE_INFO[mode].label} · {state.trouves}/9 · {score} pts · {state.erreurs}{" "}
                erreur{state.erreurs !== 1 ? "s" : ""}
              </div>
              <button className="share-btn" onClick={shareResult}>
                📱 Partager sur WhatsApp
              </button>
              <button className="rejouer-btn" onClick={backToMenu}>
                ↩ Changer de mode
              </button>
              {shareText ? <pre className="share-preview show">{shareText}</pre> : null}
            </div>
          ) : null}
        </section>
      )}
      {activeCell ? <SearchModal activeCell={activeCell} onClose={() => setActiveCell(null)} onSelect={selectPlayer} /> : null}
      {toast ? <div className="toast show">{toast}</div> : null}
    </main>
  );
}
