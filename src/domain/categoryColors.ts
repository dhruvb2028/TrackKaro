import { ExpenseCategory } from "./models";

/**
 * Categorical palette (dark-surface steps), validated for CVD separation and
 * >=3:1 contrast against the app surface. Each category always keeps its own
 * hue — colour follows the entity, never its rank. Bars also carry a direct
 * text label, which is the secondary encoding the floor-band CVD requires.
 */
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: "#3987e5",
  travel: "#199e70",
  shopping: "#c98500",
  bills: "#008300",
  emi: "#9085e9",
  family_transfer: "#e66767",
  other: "#d55181",
};
