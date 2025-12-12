export enum Color {
  OLIVE_DARK = "OLIVE_DARK",
  OLIVE_LIGHT = "OLIVE_LIGHT",
  OLIVE_MEDIUM = "OLIVE_MEDIUM",
  KHAKI_BROWN = "KHAKI_BROWN",
  MUSTARD = "MUSTARD",
  BURNT_ORANGE = "BURNT_ORANGE",
  TEAL_MUTED = "TEAL_MUTED",
  WOOD_BG = "WOOD_BG",
}

export interface RecurringActivity {
  id?: number;
  targetedActivityId: number;
  percent: number;
}

export interface Activity {
  id?: number;
  title: string;
  description: string;
  color: Color;
  recurringActivities: RecurringActivity[];
}
