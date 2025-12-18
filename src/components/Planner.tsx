import { useState, useMemo, useRef, useEffect } from 'react'
import { Activity } from '../models/Activity'
import { ScheduledActivity, PlannedActivity } from '../models/Planning'
import { getColorHex, getTextColor } from '../utils/ColorUtils'

interface PlannerProps {
  activities: Activity[]
  scheduledActivities: ScheduledActivity[]
  plannedActivities: PlannedActivity[]
  onScheduledActivityCreate?: (scheduled: ScheduledActivity) => void
  onScheduledActivityUpdate?: (scheduled: ScheduledActivity) => void
  onPlannedActivityCreate?: (planned: PlannedActivity) => void
  onPlannedActivityUpdate?: (planned: PlannedActivity) => void
  currentWeek?: Date
  onWeekChange?: (weekStart: Date) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS_OF_WEEK = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const SLOT_HEIGHT = 60 // Hauteur d'un slot d'une heure en pixels
const SLOT_MINUTES = 15 // Granularité des slots (15 minutes)

export default function Planner({
  activities,
  scheduledActivities,
  plannedActivities,
  onScheduledActivityCreate,
  onScheduledActivityUpdate: _onScheduledActivityUpdate,
  onPlannedActivityUpdate: _onPlannedActivityUpdate,
  currentWeek = new Date(),
  onWeekChange,
}: PlannerProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ day: number; hour: number; minute: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ day: number; hour: number; minute: number } | null>(null)
  const plannerRef = useRef<HTMLDivElement>(null)

  // Calculer le début de la semaine (lundi)
  const weekStart = useMemo(() => {
    const start = new Date(currentWeek)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Ajuster pour lundi
    return new Date(start.setDate(diff))
  }, [currentWeek])

  // Générer les jours de la semaine
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      return date
    })
  }, [weekStart])

  // Convertir HH:mm en minutes depuis minuit
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Convertir minutes en HH:mm
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Gérer le clic sur un slot
  const handleSlotClick = (day: Date, hour: number, minute: number) => {
    if (!selectedActivity) return

    const dayOfWeek = day.getDay()
    const startTime = minutesToTime(hour * 60 + minute)
    const endTime = minutesToTime(hour * 60 + minute + 60) // Par défaut 1 heure

    const newScheduled: ScheduledActivity = {
      activityId: selectedActivity.id!,
      startTime,
      endTime,
      dayOfWeek,
    }

    onScheduledActivityCreate?.(newScheduled)
    setSelectedActivity(null)
  }

  // Gérer le début du drag
  const handleMouseDown = (day: Date, hour: number, minute: number) => {
    if (!selectedActivity) return

    const dayOfWeek = day.getDay()
    setIsDragging(true)
    setDragStart({ day: dayOfWeek, hour, minute })
    setDragEnd({ day: dayOfWeek, hour, minute })
  }

  // Gérer le mouvement de la souris pendant le drag
  const handleMouseMove = (day: Date, hour: number, minute: number) => {
    if (!isDragging || !dragStart) return

    const dayOfWeek = day.getDay()
    setDragEnd({ day: dayOfWeek, hour, minute })
  }

  // Gérer la fin du drag
  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd || !selectedActivity) {
      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)
      return
    }

    const startMinutes = dragStart.hour * 60 + dragStart.minute
    const endMinutes = dragEnd.hour * 60 + dragEnd.minute
    const finalStart = Math.min(startMinutes, endMinutes)
    const finalEnd = Math.max(startMinutes, endMinutes)

    if (finalEnd - finalStart < 15) {
      // Minimum 15 minutes
      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)
      return
    }

    const newScheduled: ScheduledActivity = {
      activityId: selectedActivity.id!,
      startTime: minutesToTime(finalStart),
      endTime: minutesToTime(finalEnd),
      dayOfWeek: dragStart.day,
    }

    onScheduledActivityCreate?.(newScheduled)
    setSelectedActivity(null)
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }

  // Calculer la position et la hauteur d'une activité planifiée
  const getActivityStyle = (planned: PlannedActivity, day: Date): React.CSSProperties | null => {
    const dateStr = day.toISOString().split('T')[0]
    if (planned.date !== dateStr) return null

    const start = timeToMinutes(planned.startTime)
    const end = timeToMinutes(planned.endTime)
    const duration = end - start

    const activity = activities.find(a => a.id === planned.activityId)
    if (!activity) return null

    const top = (start / 60) * SLOT_HEIGHT
    const height = (duration / 60) * SLOT_HEIGHT

    return {
      position: 'absolute',
      top: `${top}px`,
      height: `${height}px`,
      left: '0',
      right: '0',
      backgroundColor: getColorHex(activity.color),
      color: getTextColor(getColorHex(activity.color)),
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '12px',
      overflow: 'hidden',
      zIndex: 10,
      cursor: 'pointer',
    }
  }

  // Calculer la position et la hauteur d'une activité planifiée en drag
  const getDragStyle = (): React.CSSProperties | null => {
    if (!isDragging || !dragStart || !dragEnd) return null

    const startMinutes = dragStart.hour * 60 + dragStart.minute
    const endMinutes = dragEnd.hour * 60 + dragEnd.minute
    const finalStart = Math.min(startMinutes, endMinutes)
    const finalEnd = Math.max(startMinutes, endMinutes)
    const duration = finalEnd - finalStart

    const top = (finalStart / 60) * SLOT_HEIGHT
    const height = (duration / 60) * SLOT_HEIGHT

    if (!selectedActivity) return null

    return {
      position: 'absolute',
      top: `${top}px`,
      height: `${height}px`,
      left: '0',
      right: '0',
      backgroundColor: getColorHex(selectedActivity.color),
      opacity: 0.5,
      borderRadius: '4px',
      border: '2px dashed',
      borderColor: getTextColor(getColorHex(selectedActivity.color)),
      zIndex: 20,
      pointerEvents: 'none',
    }
  }

  // Gérer les événements globaux pour le drag
  useEffect(() => {
    if (!isDragging) return

    const handleGlobalMouseUp = () => {
      handleMouseUp()
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!plannerRef.current || !isDragging || !dragStart) return

      const rect = plannerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Calculer la colonne (jour)
      const dayWidth = rect.width / 7
      const dayIndex = Math.floor(x / dayWidth)
      if (dayIndex < 0 || dayIndex >= 7) return

      // Calculer l'heure et la minute
      const headerHeight = 48
      const relativeY = y - headerHeight
      const totalMinutes = (relativeY / SLOT_HEIGHT) * 60
      const hour = Math.floor(totalMinutes / 60)
      const minute = Math.floor((totalMinutes % 60) / SLOT_MINUTES) * SLOT_MINUTES

      if (hour >= 0 && hour < 24) {
        const day = weekDays[dayIndex]
        handleMouseMove(day, hour, minute)
      }
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('mousemove', handleGlobalMouseMove)
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mousemove', handleGlobalMouseMove)
    }
  }, [isDragging, dragStart, dragEnd, selectedActivity, weekDays])

  const handlePreviousWeek = () => {
    const prevWeek = new Date(weekStart)
    prevWeek.setDate(prevWeek.getDate() - 7)
    onWeekChange?.(prevWeek)
  }

  const handleNextWeek = () => {
    const nextWeek = new Date(weekStart)
    nextWeek.setDate(nextWeek.getDate() + 7)
    onWeekChange?.(nextWeek)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Sélecteur d'activité */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">Sélectionner une activité :</span>
          {activities.map(activity => (
            <button
              key={activity.id}
              onClick={() => {
                setSelectedActivity(activity)
              }}
              className={`px-3 py-1 rounded transition-all ${
                selectedActivity?.id === activity.id
                  ? 'ring-2 ring-offset-2'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: getColorHex(activity.color),
                color: getTextColor(getColorHex(activity.color)),
                '--tw-ring-color': getColorHex(activity.color),
              } as React.CSSProperties}
            >
              {activity.title}
            </button>
          ))}
        </div>
        {selectedActivity && (
          <p className="text-sm text-gray-600 mt-2">
            Cliquez et glissez sur le planner pour créer une activité planifiée
          </p>
        )}
      </div>

      {/* Planner */}
      <div className="flex-1 overflow-auto" ref={plannerRef}>
        <div className="flex">
          {/* Colonne des heures */}
          <div className="w-20 flex-shrink-0 border-r">
            <div className="h-12 border-b"></div>
            {HOURS.map(hour => (
              <div
                key={hour}
                className="border-b"
                style={{ height: `${SLOT_HEIGHT}px` }}
              >
                <div className="text-xs text-gray-500 p-1">{hour}h</div>
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          {weekDays.map((day, dayIndex) => {
            const dayOfWeek = day.getDay()
            const isToday = day.toDateString() === new Date().toDateString()

            return (
              <div key={dayIndex} className="flex-1 border-r last:border-r-0 relative">
                {/* En-tête du jour */}
                <div
                  className={`h-12 border-b text-center flex flex-col justify-center ${
                    isToday ? 'bg-blue-50 font-semibold' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-sm">{DAYS_OF_WEEK[dayOfWeek]}</div>
                  <div className="text-xs text-gray-500">
                    {day.getDate()}/{day.getMonth() + 1}
                  </div>
                </div>

                {/* Slots horaires */}
                <div className="relative" style={{ height: `${HOURS.length * SLOT_HEIGHT}px` }}>
                  {HOURS.map(hour => {
                    const slots = Array.from({ length: 60 / SLOT_MINUTES }, (_, i) => {
                      const minute = i * SLOT_MINUTES
                      return { hour, minute }
                    })

                    return slots.map((slot) => {
                      const isDragSlot =
                        isDragging &&
                        dragStart &&
                        dragEnd &&
                        dayOfWeek === dragStart.day &&
                        slot.hour === dragStart.hour &&
                        slot.minute === dragStart.minute

                      return (
                        <div
                          key={`${slot.hour}-${slot.minute}`}
                          className={`border-b border-r cursor-pointer transition-colors ${
                            selectedActivity ? 'hover:bg-blue-100' : ''
                          } ${isDragSlot ? 'bg-blue-200' : ''}`}
                          style={{
                            height: `${SLOT_HEIGHT / (60 / SLOT_MINUTES)}px`,
                            position: 'relative',
                          }}
                          onMouseDown={() => handleMouseDown(day, slot.hour, slot.minute)}
                          onClick={() => handleSlotClick(day, slot.hour, slot.minute)}
                        />
                      )
                    })
                  })}

                  {/* Afficher les activités planifiées */}
                  {plannedActivities
                    .filter(planned => {
                      const dateStr = day.toISOString().split('T')[0]
                      return planned.date === dateStr
                    })
                    .map(planned => {
                      const style = getActivityStyle(planned, day)
                      if (!style) return null
                      const activity = activities.find(a => a.id === planned.activityId)

                      return (
                        <div
                          key={planned.id}
                          style={style}
                          className="flex flex-col justify-center"
                          title={activity?.title}
                        >
                          <div className="font-medium truncate">{activity?.title}</div>
                          <div className="text-xs opacity-90">
                            {planned.startTime} - {planned.endTime}
                          </div>
                        </div>
                      )
                    })}

                  {/* Afficher les activités planifiées (scheduled) */}
                  {scheduledActivities
                    .filter(scheduled => scheduled.dayOfWeek === dayOfWeek)
                    .map(scheduled => {
                      const start = timeToMinutes(scheduled.startTime)
                      const end = timeToMinutes(scheduled.endTime)
                      const duration = end - start
                      const top = (start / 60) * SLOT_HEIGHT
                      const height = (duration / 60) * SLOT_HEIGHT

                      const activity = activities.find(a => a.id === scheduled.activityId)
                      if (!activity) return null

                      return (
                        <div
                          key={scheduled.id}
                          style={{
                            position: 'absolute',
                            top: `${top}px`,
                            height: `${height}px`,
                            left: '0',
                            right: '0',
                            backgroundColor: getColorHex(activity.color),
                            color: getTextColor(getColorHex(activity.color)),
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            opacity: 0.7,
                            border: '1px dashed',
                            borderColor: getTextColor(getColorHex(activity.color)),
                            zIndex: 5,
                            cursor: 'pointer',
                          }}
                          className="flex flex-col justify-center"
                          title={`${activity.title} (récurrent)`}
                        >
                          <div className="font-medium truncate">{activity.title}</div>
                          <div className="text-xs opacity-90">
                            {scheduled.startTime} - {scheduled.endTime}
                          </div>
                        </div>
                      )
                    })}

                  {/* Afficher le drag en cours */}
                  {isDragging && dragStart && dragEnd && dragStart.day === dayOfWeek && (
                    <div style={getDragStyle() || {}}>
                      {selectedActivity && (
                        <div className="p-2 text-center">
                          {selectedActivity.title}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation de semaine */}
      <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
        <button
          onClick={handlePreviousWeek}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
        >
          ← Semaine précédente
        </button>
        <div className="text-sm font-medium">
          Semaine du {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <button
          onClick={handleNextWeek}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
        >
          Semaine suivante →
        </button>
      </div>
    </div>
  )
}
