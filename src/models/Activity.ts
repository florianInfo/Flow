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

export interface Task {
  id?: number;
  title: string;
  description: string;
  isChecked?: boolean; // Checkbox pour marquer comme complétée
  isDeleted?: boolean;
  subtasks?: Task[]; // Liste de sous-tâches (références cycliques autorisées)
}

export interface Activity {
  id?: number;
  title: string;
  description: string;
  color: Color | string; // Peut être un Color enum ou un hex string pour les couleurs personnalisées
  textColor?: 'black' | 'white'; // Couleur du texte (noir ou blanc)
  recurringActivities: RecurringActivity[];
  tasks?: Task[]; // Liste de tâches associées à l'activité
}
