import { MAX_ERRORS, MODE_INFO } from "@/game/constants";
import type { Mode } from "@/game/types";

type RulesPanelProps = {
  mode: Mode;
};

const RULES_TEXT: Record<Mode, string> = {
  cc: "Joueur ayant joué dans les deux clubs",
  ca: "Joueur L1 25/26 qui était dans ce club cette saison-là",
  cs: "Joueur ayant joué dans le club ET cette nationalité"
};

export default function RulesPanel({ mode }: RulesPanelProps) {
  return (
    <div className="rules">
      <span>
        {RULES_TEXT[mode]} · <strong>{MAX_ERRORS} erreurs</strong> max
      </span>
      <span className={`mode-badge ${MODE_INFO[mode].cls}`}>{MODE_INFO[mode].label}</span>
    </div>
  );
}
