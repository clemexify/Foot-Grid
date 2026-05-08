import { CLUB_LOGOS, FLAGS } from "@/game/constants";
import type { AxisType } from "@/game/types";

type HeaderCellProps = {
  value: string | number;
  type: AxisType;
  isRow: boolean;
};

export default function HeaderCell({ value, type, isRow }: HeaderCellProps) {
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
