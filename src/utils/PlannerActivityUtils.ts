import { Activity } from '../models/Activity'
import { ScheduledActivity, PlannedActivity } from '../models/Planning'
import { timeToMinutes } from './TimeUtils'
import { getOverlappingActivities } from './ActivityOverlapUtils'
import { calculateActivityPosition } from './PlannerPositionUtils'

/**
 * Prépare les activités planifiées pour l'affichage dans le mode calendrier
 */
export function preparePlannedActivitiesForDay(
  plannedActivities: PlannedActivity[],
  day: Date,
  selectedPlannedActivity: PlannedActivity | null,
  activities: Activity[],
  startHour: number,
  slotHeight: number
): Array<{
  planned: PlannedActivity
  activity: Activity
  position: { top: number; height: number; left: number; width: number }
  isSelected: boolean
}> {
  const dateStr = day.toISOString().split('T')[0]
  const dayPlanned = plannedActivities.filter(p => p.date === dateStr)
  
  // Utiliser les activités mises à jour pour le calcul des chevauchements
  const dayPlannedUpdated: PlannedActivity[] = dayPlanned.map(p =>
    (selectedPlannedActivity && selectedPlannedActivity.id === p.id) ? selectedPlannedActivity : p
  )
  
  const positions = getOverlappingActivities(dayPlannedUpdated, day, timeToMinutes)
  
  return dayPlanned
    .map(planned => {
      const displayPlanned: PlannedActivity = (selectedPlannedActivity && selectedPlannedActivity.id === planned.id) 
        ? selectedPlannedActivity 
        : planned
      
      const activity = activities.find(a => a.id === displayPlanned.activityId)
      if (!activity) return null

      const { top, height } = calculateActivityPosition(displayPlanned.startTime, displayPlanned.endTime, startHour, slotHeight)
      const positionData = positions.get(planned.id || 0) || { left: 0, width: 100 }
      
      return {
        planned: displayPlanned,
        activity,
        position: {
          top,
          height,
          left: positionData.left,
          width: positionData.width,
        },
        isSelected: selectedPlannedActivity?.id === planned.id,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

/**
 * Prépare les activités scheduled pour l'affichage dans le mode routine
 */
export function prepareScheduledActivitiesForDay(
  scheduledActivities: ScheduledActivity[],
  day: Date,
  dayOfWeek: number,
  selectedScheduledActivity: ScheduledActivity | null,
  activities: Activity[],
  startHour: number,
  slotHeight: number
): Array<{
  scheduled: ScheduledActivity
  activity: Activity
  position: { top: number; height: number; left: number; width: number }
  isSelected: boolean
}> {
  // Filtrer les activités scheduled pour ce jour
  const dayScheduled = scheduledActivities.filter(s => {
    // Si c'est une activité quotidienne avec frequency < 7, l'afficher sur tous les jours
    if (s.periodicity?.unit === 'daily' && s.periodicity.frequency < 7) {
      return true
    }
    // Sinon, filtrer par dayOfWeek
    return s.dayOfWeek === dayOfWeek
  })
  
  // Utiliser les activités mises à jour pour le calcul des chevauchements
  const dayScheduledUpdated: ScheduledActivity[] = dayScheduled
    .map(s =>
      (selectedScheduledActivity && selectedScheduledActivity.id === s.id) 
        ? selectedScheduledActivity 
        : s
    )
    .filter((s): s is ScheduledActivity => s !== null)
  
  // Convertir les scheduled en "planned" pour le calcul de chevauchement
  const dateStr = day.toISOString().split('T')[0]
  const scheduledAsPlanned: PlannedActivity[] = dayScheduledUpdated.map(s => ({
    id: s.id,
    activityId: s.activityId,
    date: dateStr,
    startTime: s.startTime,
    endTime: s.endTime,
    scheduledActivityId: s.id
  }))
  
  const positions = getOverlappingActivities(scheduledAsPlanned, day, timeToMinutes)
  
  return dayScheduledUpdated
    .map(scheduled => {
      const displayScheduled: ScheduledActivity = 
        (selectedScheduledActivity && selectedScheduledActivity.id === scheduled.id) 
          ? selectedScheduledActivity 
          : scheduled
      
      const activity = activities.find(a => a.id === displayScheduled.activityId)
      if (!activity) return null

      const { top, height } = calculateActivityPosition(displayScheduled.startTime, displayScheduled.endTime, startHour, slotHeight)
      const positionData = positions.get(scheduled.id || 0) || { left: 0, width: 100 }
      
      return {
        scheduled: displayScheduled,
        activity,
        position: {
          top,
          height,
          left: positionData.left,
          width: positionData.width,
        },
        isSelected: selectedScheduledActivity?.id === scheduled.id,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

