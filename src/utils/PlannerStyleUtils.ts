import { Activity } from '../models/Activity'
import { PlannedActivity, ScheduledActivity } from '../models/Planning'
import { getColorHex, getTextColor } from './ColorUtils'
import { calculateActivityPosition } from './PlannerPositionUtils'
import { adjustTimeBounds } from './TimeUtils'

/**
 * Calcule le style pour le preview hover d'une activité
 */
export function calculateHoverPreviewStyle(
  day: Date,
  hoveredSlot: { day: Date; hour: number; minute: number } | null,
  draggedActivity: Activity | null,
  draggedPlannedActivity: PlannedActivity | null,
  draggedScheduledActivity: ScheduledActivity | null,
  activities: Activity[],
  defaultActivityDuration: number,
  startHour: number,
  endHour: number,
  slotHeight: number,
  timeToMinutes: (time: string) => number,
  minutesToTime: (minutes: number) => string
): React.CSSProperties | null {
  // Vérifier si on est en train de draguer quelque chose
  if (!draggedActivity && !draggedPlannedActivity && !draggedScheduledActivity) {
    return null
  }

  // Vérifier si ce jour est dans la zone de hover
  if (!hoveredSlot || hoveredSlot.day.toDateString() !== day.toDateString()) {
    return null
  }

  let activity: Activity | null = null
  let duration = defaultActivityDuration

  if (draggedActivity) {
    activity = draggedActivity
    duration = defaultActivityDuration
  } else if (draggedPlannedActivity) {
    activity = activities.find(a => a.id === draggedPlannedActivity.activityId) || null
    duration = timeToMinutes(draggedPlannedActivity.endTime) - timeToMinutes(draggedPlannedActivity.startTime)
  } else if (draggedScheduledActivity) {
    activity = activities.find(a => a.id === draggedScheduledActivity.activityId) || null
    duration = timeToMinutes(draggedScheduledActivity.endTime) - timeToMinutes(draggedScheduledActivity.startTime)
  }

  if (!activity) return null

  // Calculer la position et la hauteur du preview en utilisant adjustTimeBounds
  const adjusted = adjustTimeBounds(hoveredSlot.hour, hoveredSlot.minute, duration, startHour, endHour)
  if (!adjusted) return null
  
  const { startMinutes: previewStartMinutes } = adjusted
  const previewTime = minutesToTime(previewStartMinutes)
  const previewEndTime = minutesToTime(previewStartMinutes + duration)
  const { top, height } = calculateActivityPosition(previewTime, previewEndTime, startHour, slotHeight)

  return {
    position: 'absolute',
    top: `${top}px`,
    height: `${height}px`,
    left: '0',
    right: '0',
    backgroundColor: getColorHex(activity.color),
    opacity: 0.6,
    borderRadius: '4px',
    zIndex: 30,
    pointerEvents: 'none',
    border: `2px dashed ${getTextColor(getColorHex(activity.color))}`,
    boxSizing: 'border-box',
  }
}

