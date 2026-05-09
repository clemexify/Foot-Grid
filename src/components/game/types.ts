import type { AxisType } from "@/game/types";

export type ActiveCell = {
  key: string;
  row: string | number;
  col: string | number;
  rowType: AxisType;
  colType: AxisType;
};
