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
  onActivityDoubleClick?: (activityId: number) => void
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
  onScheduledActivityUpdate,
  onPlannedActivityUpdate,
  currentWeek = new Date(),
  onWeekChange,
  onActivityDoubleClick,
}: PlannerProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ day: number; hour: number; minute: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ day: number; hour: number; minute: number } | null>(null)
  const [selectedPlannedActivity, setSelectedPlannedActivity] = useState<PlannedActivity | null>(null)
  const [selectedScheduledActivity, setSelectedScheduledActivity] = useState<ScheduledActivity | null>(null)
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null)
  const [resizeStartY, setResizeStartY] = useState<number | null>(null)
  const [resizeStartTime, setResizeStartTime] = useState<string | null>(null)
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
    // Désélectionner les activités si on clique sur un slot vide
    setSelectedPlannedActivity(null)
    setSelectedScheduledActivity(null)
    
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

  // Détecter les chevauchements et calculer la position/largeur des activités
  const getOverlappingActivities = (plannedActivities: PlannedActivity[], day: Date) => {
    const dateStr = day.toISOString().split('T')[0]
    const dayActivities = plannedActivities.filter(p => p.date === dateStr)
    
    // Trier par heure de début
    const sorted = [...dayActivities].sort((a, b) => 
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    )
    
    // Grouper les activités qui se chevauchent
    const groups: PlannedActivity[][] = []
    
    sorted.forEach(activity => {
      const start = timeToMinutes(activity.startTime)
      const end = timeToMinutes(activity.endTime)
      
      // Trouver un groupe où cette activité chevauche
      let addedToGroup = false
      for (const group of groups) {
        // Vérifier si l'activité chevauche avec au moins une activité du groupe
        const overlaps = group.some(groupActivity => {
          const groupStart = timeToMinutes(groupActivity.startTime)
          const groupEnd = timeToMinutes(groupActivity.endTime)
          return (start < groupEnd && end > groupStart)
        })
        
        if (overlaps) {
          group.push(activity)
          addedToGroup = true
          break
        }
      }
      
      // Si aucune chevauchement, créer un nouveau groupe
      if (!addedToGroup) {
        groups.push([activity])
      }
    })
    
    // Calculer la position et largeur pour chaque activité dans chaque groupe
    const activityPositions = new Map<number, { left: number; width: number }>()
    
    groups.forEach(group => {
      if (group.length === 1) {
        // Une seule activité, prend toute la largeur
        activityPositions.set(group[0].id || 0, { left: 0, width: 100 })
      } else {
        // Plusieurs activités, les répartir horizontalement
        const width = 100 / group.length
        group.forEach((activity, index) => {
          activityPositions.set(activity.id || 0, {
            left: index * width,
            width: width
          })
        })
      }
    })
    
    return activityPositions
  }

  // Calculer la position et la hauteur d'une activité planifiée
  const getActivityStyle = (planned: PlannedActivity, day: Date, allPlanned: PlannedActivity[]): React.CSSProperties | null => {
    const dateStr = day.toISOString().split('T')[0]
    if (planned.date !== dateStr) return null

    const start = timeToMinutes(planned.startTime)
    const end = timeToMinutes(planned.endTime)
    const duration = end - start

    const activity = activities.find(a => a.id === planned.activityId)
    if (!activity) return null

    const top = (start / 60) * SLOT_HEIGHT
    const height = (duration / 60) * SLOT_HEIGHT

    // Calculer la position et largeur en fonction des chevauchements
    const positions = getOverlappingActivities(allPlanned, day)
    const position = positions.get(planned.id || 0) || { left: 0, width: 100 }
    
    const isSelected = selectedPlannedActivity?.id === planned.id

    return {
      position: 'absolute',
      top: `${top}px`,
      height: `${height}px`,
      left: `${position.left}%`,
      width: `${position.width}%`,
      backgroundColor: getColorHex(activity.color),
      color: getTextColor(getColorHex(activity.color)),
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '12px',
      overflow: 'hidden',
      zIndex: isSelected ? 15 : 10,
      cursor: 'pointer',
      marginLeft: position.left > 0 ? '2px' : '0',
      marginRight: position.left + position.width < 100 ? '2px' : '0',
      boxSizing: 'border-box',
      borderWidth: isSelected ? '3px' : '0',
      borderStyle: isSelected ? 'dashed' : 'none',
      borderColor: isSelected ? getTextColor(getColorHex(activity.color)) : 'transparent',
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
      borderWidth: '2px',
      borderStyle: 'dashed',
      borderColor: getTextColor(getColorHex(selectedActivity.color)),
      zIndex: 20,
      pointerEvents: 'none',
    }
  }

  // Gérer le redimensionnement d'une activité
  const handleResizeStart = (e: React.MouseEvent, activity: PlannedActivity | ScheduledActivity, edge: 'top' | 'bottom') => {
    e.stopPropagation()
    setIsResizing(edge)
    setResizeStartY(e.clientY)
    if ('date' in activity) {
      setResizeStartTime(edge === 'top' ? activity.startTime : activity.endTime)
      setSelectedPlannedActivity(activity as PlannedActivity)
    } else {
      setResizeStartTime(edge === 'top' ? activity.startTime : activity.endTime)
      setSelectedScheduledActivity(activity as ScheduledActivity)
    }
  }

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeStartY || !resizeStartTime || !plannerRef.current) return

    const rect = plannerRef.current.getBoundingClientRect()
    const headerHeight = 48
    const relativeY = e.clientY - rect.top - headerHeight
    const totalMinutes = (relativeY / SLOT_HEIGHT) * 60
    const hour = Math.floor(totalMinutes / 60)
    const minute = Math.floor((totalMinutes % 60) / SLOT_MINUTES) * SLOT_MINUTES
    
    if (hour < 0 || hour >= 24) return

    const newTime = minutesToTime(hour * 60 + minute)
    
    if (selectedPlannedActivity) {
      const updated: PlannedActivity = {
        ...selectedPlannedActivity,
        startTime: isResizing === 'top' ? newTime : selectedPlannedActivity.startTime,
        endTime: isResizing === 'bottom' ? newTime : selectedPlannedActivity.endTime,
      }
      
      // Vérifier que endTime > startTime
      const start = timeToMinutes(updated.startTime)
      const end = timeToMinutes(updated.endTime)
      if (end > start && end - start >= 15) { // Minimum 15 minutes
        setSelectedPlannedActivity(updated)
        // Ne pas appeler onPlannedActivityUpdate ici, seulement à la fin du resize
      }
    } else if (selectedScheduledActivity) {
      const updated: ScheduledActivity = {
        ...selectedScheduledActivity,
        startTime: isResizing === 'top' ? newTime : selectedScheduledActivity.startTime,
        endTime: isResizing === 'bottom' ? newTime : selectedScheduledActivity.endTime,
      }
      
      // Vérifier que endTime > startTime
      const start = timeToMinutes(updated.startTime)
      const end = timeToMinutes(updated.endTime)
      if (end > start && end - start >= 15) { // Minimum 15 minutes
        setSelectedScheduledActivity(updated)
        // Ne pas appeler onScheduledActivityUpdate ici, seulement à la fin du resize
      }
    }
  }

  const handleResizeEnd = () => {
    // Mettre à jour l'activité une dernière fois à la fin du resize
    if (selectedPlannedActivity) {
      onPlannedActivityUpdate?.(selectedPlannedActivity)
    } else if (selectedScheduledActivity) {
      onScheduledActivityUpdate?.(selectedScheduledActivity)
    }
    
    setIsResizing(null)
    setResizeStartY(null)
    setResizeStartTime(null)
  }

  // Gérer les événements globaux pour le drag
  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp()
      }
      if (isResizing) {
        handleResizeEnd()
      }
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        handleResizeMove(e)
        return
      }
      
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
  }, [isDragging, isResizing, dragStart, dragEnd, selectedActivity, weekDays, selectedPlannedActivity, selectedScheduledActivity, resizeStartY, resizeStartTime])

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
                  {(() => {
                    const dateStr = day.toISOString().split('T')[0]
                    const dayPlanned = plannedActivities.filter(p => p.date === dateStr)
                    
                    // Utiliser les activités mises à jour pour le calcul des chevauchements
                    const dayPlannedUpdated: PlannedActivity[] = dayPlanned.map(p =>
                      (selectedPlannedActivity && selectedPlannedActivity.id === p.id) ? selectedPlannedActivity : p
                    )
                    
                    return dayPlanned.map(planned => {
                      // Utiliser l'activité sélectionnée mise à jour si elle correspond
                      const displayPlanned: PlannedActivity = (selectedPlannedActivity && selectedPlannedActivity.id === planned.id) 
                        ? selectedPlannedActivity 
                        : planned
                      
                      const style = getActivityStyle(displayPlanned, day, dayPlannedUpdated)
                      if (!style) return null
                      const activity = activities.find(a => a.id === displayPlanned.activityId)

                      const isSelected = selectedPlannedActivity?.id === planned.id

                      return (
                        <div
                          key={planned.id}
                          style={style}
                          className="flex flex-col justify-center relative"
                          title={activity?.title}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPlannedActivity(planned)
                            setSelectedScheduledActivity(null)
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            if (activity?.id && onActivityDoubleClick) {
                              onActivityDoubleClick(activity.id)
                            }
                          }}
                        >
                          {/* Poignée de redimensionnement en haut */}
                          {isSelected && activity && (
                            <div
                              className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-20"
                              onMouseDown={(e) => handleResizeStart(e, planned, 'top')}
                              style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                borderTop: '2px solid',
                                borderColor: getTextColor(getColorHex(activity.color)),
                              }}
                            />
                          )}
                          
                          <div className="font-medium truncate">{activity?.title}</div>
                          <div className="text-xs opacity-90">
                            {displayPlanned.startTime} - {displayPlanned.endTime}
                          </div>
                          
                          {/* Poignée de redimensionnement en bas */}
                          {isSelected && activity && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20"
                              onMouseDown={(e) => handleResizeStart(e, planned, 'bottom')}
                              style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                borderBottom: '2px solid',
                                borderColor: getTextColor(getColorHex(activity.color)),
                              }}
                            />
                          )}
                        </div>
                      )
                    })
                  })()}

                  {/* Afficher les activités planifiées (scheduled) */}
                  {(() => {
                    const dayScheduled = scheduledActivities.filter(s => s.dayOfWeek === dayOfWeek)
                    
                    // Utiliser les activités mises à jour pour le calcul des chevauchements
                    const dateStr = day.toISOString().split('T')[0]
                    const dayPlanned: PlannedActivity[] = plannedActivities
                      .filter(p => p.date === dateStr)
                      .map(p => 
                        (selectedPlannedActivity && selectedPlannedActivity.id === p.id) 
                          ? selectedPlannedActivity 
                          : p
                      )
                    
                    const dayScheduledUpdated: ScheduledActivity[] = dayScheduled
                      .map(s =>
                        (selectedScheduledActivity && selectedScheduledActivity.id === s.id) 
                          ? selectedScheduledActivity 
                          : s
                      )
                      .filter((s): s is ScheduledActivity => s !== null)
                    
                    // Convertir les scheduled en "planned" pour le calcul de chevauchement
                    const scheduledAsPlanned: PlannedActivity[] = dayScheduledUpdated.map(s => ({
                      id: s.id,
                      activityId: s.activityId,
                      date: dateStr,
                      startTime: s.startTime,
                      endTime: s.endTime,
                      scheduledActivityId: s.id
                    }))
                    
                    // Combiner avec les planned pour calculer les chevauchements
                    const allActivitiesForDay: PlannedActivity[] = [...dayPlanned, ...scheduledAsPlanned]
                    
                    const positions = getOverlappingActivities(allActivitiesForDay, day)
                    
                    return dayScheduled.map(scheduled => {
                      // Utiliser l'activité sélectionnée mise à jour si elle correspond
                      const displayScheduled: ScheduledActivity = 
                        (selectedScheduledActivity && selectedScheduledActivity.id === scheduled.id) 
                          ? selectedScheduledActivity 
                          : scheduled
                      
                      const start = timeToMinutes(displayScheduled.startTime)
                      const end = timeToMinutes(displayScheduled.endTime)
                      const duration = end - start
                      const top = (start / 60) * SLOT_HEIGHT
                      const height = (duration / 60) * SLOT_HEIGHT

                      const activity = activities.find(a => a.id === displayScheduled.activityId)
                      if (!activity) return null

                      const position = positions.get(scheduled.id || 0) || { left: 0, width: 100 }

                      const isSelected = selectedScheduledActivity?.id === scheduled.id

                      return (
                        <div
                          key={scheduled.id}
                          style={{
                            position: 'absolute',
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `${position.left}%`,
                            width: `${position.width}%`,
                            backgroundColor: getColorHex(activity.color),
                            color: getTextColor(getColorHex(activity.color)),
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            opacity: 0.7,
                            borderWidth: isSelected ? '3px' : '1px',
                            borderStyle: 'dashed',
                            borderColor: getTextColor(getColorHex(activity.color)),
                            zIndex: isSelected ? 15 : 5,
                            cursor: 'pointer',
                            marginLeft: position.left > 0 ? '2px' : '0',
                            marginRight: position.left + position.width < 100 ? '2px' : '0',
                            boxSizing: 'border-box',
                          }}
                          className="flex flex-col justify-center relative"
                          title={`${activity.title} (récurrent)`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedScheduledActivity(scheduled)
                            setSelectedPlannedActivity(null)
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            if (activity.id && onActivityDoubleClick) {
                              onActivityDoubleClick(activity.id)
                            }
                          }}
                        >
                          {/* Poignée de redimensionnement en haut */}
                          {isSelected && activity && (
                            <div
                              className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-20"
                              onMouseDown={(e) => handleResizeStart(e, scheduled, 'top')}
                              style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                borderTop: '2px solid',
                                borderColor: getTextColor(getColorHex(activity.color)),
                              }}
                            />
                          )}
                          
                          <div className="font-medium truncate">{activity.title}</div>
                          <div className="text-xs opacity-90">
                            {displayScheduled.startTime} - {displayScheduled.endTime}
                          </div>
                          
                          {/* Poignée de redimensionnement en bas */}
                          {isSelected && activity && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20"
                              onMouseDown={(e) => handleResizeStart(e, scheduled, 'bottom')}
                              style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                borderBottom: '2px solid',
                                borderColor: getTextColor(getColorHex(activity.color)),
                              }}
                            />
                          )}
                        </div>
                      )
                    })
                  })()}

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
