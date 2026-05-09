import type { Mode } from "@/game/types";

type ModePickerProps = {
  onStart: (mode: Mode) => void;
};

export default function ModePicker({ onStart }: ModePickerProps) {
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
