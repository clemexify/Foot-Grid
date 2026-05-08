"use client";

import { useMemo } from "react";

type HeaderProps = {
  score: number;
  found: number;
  inGame: boolean;
};

export default function Header({ score, found, inGame }: HeaderProps) {
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
