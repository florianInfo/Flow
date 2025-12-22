import { Activity } from './Activity'

export interface Periodicity {
  frequency: number
  unit: 'daily' | 'weekly' | 'monthly'
  weekOfMonth?: number // 1-4 pour 1ère, 2ème, 3ème, 4ème semaine, -1 pour dernière semaine (uniquement pour monthly)
}

export interface ScheduledActivity {
  id?: number
  activityId: number
  startTime: string // Format "HH:mm" (ex: "07:15")
  endTime: string   // Format "HH:mm" (ex: "08:00")
  dayOfWeek?: number // 0-6 (dimanche-samedi) pour les routines hebdomadaires
  periodicity?: Periodicity
}

export interface Template {
  id?: number
  userId: number
  scheduledActivities: ScheduledActivity[]
}

export interface PlannedActivity {
  id?: number
  scheduledActivityId?: number // Référence au ScheduledActivity source
  activityId: number
  date: string // Format ISO date (ex: "2024-01-15")
  startTime: string // Format "HH:mm"
  endTime: string   // Format "HH:mm"
}

export interface PlannerSlot {
  day: Date
  hour: number
  minute: number
  plannedActivity?: PlannedActivity
  scheduledActivity?: ScheduledActivity
}

export interface Calendar {
  id?: number
  name: string
  plannedActivities: PlannedActivity[]
}

export interface User {
  id?: number
  activities: Activity[]
  templates: Template[]
  calendars: Calendar[]
}
