export interface PlannerSettings {
  startHour: number // Heure de début (par défaut 6)
  endHour: number // Dernière heure affichée (par défaut 22)
  slotHeight: number // Hauteur d'un slot d'une heure en pixels (par défaut 60)
  slotMinutes: number // Granularité des slots en minutes (par défaut 15)
  defaultActivityDuration: number // Durée par défaut d'une activité en minutes (par défaut 30)
}

export interface AppSettings {
  planner: PlannerSettings
  // Ajouter d'autres sections de paramètres ici à l'avenir
  // exemple: activities: ActivitySettings
  // exemple: ui: UISettings
}

export const DEFAULT_PLANNER_SETTINGS: PlannerSettings = {
  startHour: 6,
  endHour: 22,
  slotHeight: 60,
  slotMinutes: 15,
  defaultActivityDuration: 30,
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  planner: DEFAULT_PLANNER_SETTINGS,
}

