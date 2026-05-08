import { MODE_INFO } from "@/game/constants";
import type { Mode } from "@/game/types";

type EndScreenProps = {
  mode: Mode;
  found: number;
  score: number;
  errors: number;
  shareText: string;
  onShare: () => void;
  onBackToMenu: () => void;
};

export default function EndScreen({ mode, found, score, errors, shareText, onShare, onBackToMenu }: EndScreenProps) {
  const won = found === 9;

  return (
    <div className="end-screen show">
      <div className={`end-title ${won ? "win" : "lose"}`}>{won ? "BRAVO !" : "DOMMAGE"}</div>
      <div className="end-score">
        {MODE_INFO[mode].emoji} {MODE_INFO[mode].label} · {found}/9 · {score} pts · {errors} erreur
        {errors !== 1 ? "s" : ""}
      </div>
      <button className="share-btn" onClick={onShare}>
        📱 Partager sur WhatsApp
      </button>
      <button className="rejouer-btn" onClick={onBackToMenu}>
        ↩ Changer de mode
      </button>
      {shareText ? <pre className="share-preview show">{shareText}</pre> : null}
    </div>
  );
}
