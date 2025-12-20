import { useState, useMemo, useRef, useEffect } from 'react'
import { Activity } from '../models/Activity'
import { ScheduledActivity, PlannedActivity } from '../models/Planning'
import { getColorHex, getTextColor } from '../utils/ColorUtils'

type PlannerMode = 'routine' | 'calendrier'

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
  mode?: PlannerMode
  onActivityDoubleClick?: (activityId: number, scheduledActivityId?: number) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS_OF_WEEK = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const SLOT_HEIGHT = 60 // Hauteur d'un slot d'une heure en pixels
const SLOT_MINUTES = 15 // Granularité des slots (15 minutes)
const DEFAULT_ACTIVITY_DURATION = 30 // minutes

export default function Planner({
  activities,
  scheduledActivities,
  plannedActivities,
  onScheduledActivityCreate,
  onScheduledActivityUpdate,
  onPlannedActivityUpdate,
  currentWeek = new Date(),
  onWeekChange,
  mode = 'routine',
  onActivityDoubleClick,
}: PlannerProps) {
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null) // Activité draguée depuis la liste
  const [draggedPlannedActivity, setDraggedPlannedActivity] = useState<PlannedActivity | null>(null) // Activité planifiée draguée
  const [draggedScheduledActivity, setDraggedScheduledActivity] = useState<ScheduledActivity | null>(null) // Activité scheduled draguée
  const [hoveredSlot, setHoveredSlot] = useState<{ day: Date; hour: number; minute: number } | null>(null)
  const [selectedPlannedActivity, setSelectedPlannedActivity] = useState<PlannedActivity | null>(null)
  const [selectedScheduledActivity, setSelectedScheduledActivity] = useState<ScheduledActivity | null>(null)
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null)
  const [resizeStartY, setResizeStartY] = useState<number | null>(null)
  const [resizeStartTime, setResizeStartTime] = useState<string | null>(null)
  const plannerRef = useRef<HTMLDivElement>(null)

  // Calculer le début de la semaine (lundi) - uniquement en mode calendrier
  const weekStart = useMemo(() => {
    if (mode === 'routine') {
      // En mode routine, on n'utilise pas de dates réelles
      return null
    }
    const start = new Date(currentWeek)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Ajuster pour lundi
    return new Date(start.setDate(diff))
  }, [currentWeek, mode])

  // Générer les jours de la semaine
  const weekDays = useMemo(() => {
    if (mode === 'routine') {
      // En mode routine, on génère juste les jours de la semaine (1 = lundi, 7 = dimanche)
      // On utilise des dates fictives pour la structure, mais on ne les affiche pas
      return Array.from({ length: 7 }, (_, i) => {
        // Créer une date de référence (lundi de la semaine courante) mais on ne l'utilise que pour la structure
        const today = new Date()
        const day = today.getDay()
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Ajuster pour lundi
        const monday = new Date(today.setDate(diff))
        const date = new Date(monday)
        date.setDate(date.getDate() + i)
        return date
      })
    }
    // En mode calendrier, on utilise les dates réelles
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart!)
      date.setDate(date.getDate() + i)
      return date
    })
  }, [weekStart, mode])

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

  // Gérer le drag depuis la liste d'activités
  const handleActivityDragStart = (e: React.DragEvent, activity: Activity) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('activity', JSON.stringify(activity))
    setDraggedActivity(activity)
  }

  // Gérer le drag d'une activité planifiée existante
  const handlePlannedActivityDragStart = (e: React.DragEvent, planned: PlannedActivity) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('plannedActivity', JSON.stringify(planned))
    setDraggedPlannedActivity(planned)
    setSelectedPlannedActivity(planned)
    setSelectedScheduledActivity(null)
  }

  // Gérer le drag d'une activité scheduled existante
  const handleScheduledActivityDragStart = (e: React.DragEvent, scheduled: ScheduledActivity) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('scheduledActivity', JSON.stringify(scheduled))
    setDraggedScheduledActivity(scheduled)
    setSelectedScheduledActivity(scheduled)
    setSelectedPlannedActivity(null)
  }

  // Gérer le drop sur un slot
  const handleDrop = (e: React.DragEvent, day: Date, hour: number, minute: number) => {
    e.preventDefault()
    e.stopPropagation()

    const dayOfWeek = day.getDay()
    const startTime = minutesToTime(hour * 60 + minute)

    // Vérifier si on drag une activité depuis la liste
    const activityData = e.dataTransfer.getData('activity')
    if (activityData) {
      const activity: Activity = JSON.parse(activityData)
      const endTime = minutesToTime(hour * 60 + minute + DEFAULT_ACTIVITY_DURATION) // Par défaut 15 minutes
      const newScheduled: ScheduledActivity = {
        activityId: activity.id!,
        startTime,
        endTime,
        dayOfWeek,
      }
      onScheduledActivityCreate?.(newScheduled)
      setDraggedActivity(null)
      setHoveredSlot(null)
      return
    }

    // Vérifier si on drag une PlannedActivity existante
    const plannedData = e.dataTransfer.getData('plannedActivity')
    if (plannedData) {
      const planned: PlannedActivity = JSON.parse(plannedData)
      
      // Si la plannedActivity a un scheduledActivityId, modifier la scheduledActivity source
      if (planned.scheduledActivityId) {
        const scheduled = scheduledActivities.find(s => s.id === planned.scheduledActivityId)
        if (scheduled) {
          // Préserver la durée de l'activité existante
          const start = timeToMinutes(scheduled.startTime)
          const end = timeToMinutes(scheduled.endTime)
          const duration = end - start
          const endTime = minutesToTime(hour * 60 + minute + duration)
          
          const updated: ScheduledActivity = {
            ...scheduled,
            startTime,
            endTime,
            dayOfWeek,
          }
          onScheduledActivityUpdate?.(updated)
          setDraggedPlannedActivity(null)
          setHoveredSlot(null)
          return
        }
      }
      
      // Sinon, modifier la plannedActivity normalement
      const dateStr = day.toISOString().split('T')[0]
      // Préserver la durée de l'activité existante
      const start = timeToMinutes(planned.startTime)
      const end = timeToMinutes(planned.endTime)
      const duration = end - start
      const endTime = minutesToTime(hour * 60 + minute + duration)
      
      const updated: PlannedActivity = {
        ...planned,
        date: dateStr,
        startTime,
        endTime,
      }
      onPlannedActivityUpdate?.(updated)
      setDraggedPlannedActivity(null)
      setHoveredSlot(null)
      return
    }

    // Vérifier si on drag une ScheduledActivity existante
    const scheduledData = e.dataTransfer.getData('scheduledActivity')
    if (scheduledData) {
      const scheduled: ScheduledActivity = JSON.parse(scheduledData)
      // Préserver la durée de l'activité existante
      const start = timeToMinutes(scheduled.startTime)
      const end = timeToMinutes(scheduled.endTime)
      const duration = end - start
      const endTime = minutesToTime(hour * 60 + minute + duration)
      
      const updated: ScheduledActivity = {
        ...scheduled,
        startTime,
        endTime,
        dayOfWeek,
      }
      onScheduledActivityUpdate?.(updated)
      setDraggedScheduledActivity(null)
      setHoveredSlot(null)
      return
    }
  }

  // Gérer le drag over pour le hover
  const handleDragOver = (e: React.DragEvent, day: Date, hour: number, minute: number) => {
    e.preventDefault()
    e.stopPropagation()
    setHoveredSlot({ day, hour, minute })
  }

  // Calculer le slot à partir des coordonnées de la souris
  const getSlotFromMousePosition = (e: React.DragEvent): { hour: number; minute: number } | null => {
    if (!plannerRef.current) return null
    
    const rect = plannerRef.current.getBoundingClientRect()
    const headerHeight = 48
    const relativeY = e.clientY - rect.top - headerHeight
    
    if (relativeY < 0) return null
    
    const totalMinutes = (relativeY / SLOT_HEIGHT) * 60
    const hour = Math.floor(totalMinutes / 60)
    const minute = Math.floor((totalMinutes % 60) / SLOT_MINUTES) * SLOT_MINUTES
    
    if (hour < 0 || hour >= 24) return null
    
    return { hour, minute }
  }

  // Gérer le drag over sur une activité
  const handleActivityDragOver = (e: React.DragEvent, day: Date, activityId?: number) => {
    // Ne pas gérer si on survole l'activité qu'on est en train de draguer
    if (draggedPlannedActivity && draggedPlannedActivity.id === activityId) {
      return
    }
    if (draggedScheduledActivity && draggedScheduledActivity.id === activityId) {
      return
    }
    
    e.preventDefault()
    e.stopPropagation()
    
    const slot = getSlotFromMousePosition(e)
    if (slot) {
      setHoveredSlot({ day, hour: slot.hour, minute: slot.minute })
    }
  }

  // Gérer le drop sur une activité
  const handleActivityDrop = (e: React.DragEvent, day: Date, activityId?: number) => {
    // Ne pas gérer si on survole l'activité qu'on est en train de draguer
    if (draggedPlannedActivity && draggedPlannedActivity.id === activityId) {
      return
    }
    if (draggedScheduledActivity && draggedScheduledActivity.id === activityId) {
      return
    }
    
    e.preventDefault()
    e.stopPropagation()
    
    const slot = getSlotFromMousePosition(e)
    if (slot) {
      handleDrop(e, day, slot.hour, slot.minute)
    }
  }

  // Gérer le drag leave
  const handleDragLeave = () => {
    setHoveredSlot(null)
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
      borderWidth: isSelected ? '2px' : '0',
      borderStyle: isSelected ? 'solid' : 'none',
      borderColor: isSelected ? getTextColor(getColorHex(activity.color)) : 'transparent',
    }
  }

  // Calculer le style du hover preview pour une colonne de jour
  const getHoverPreviewStyle = (day: Date): React.CSSProperties | null => {
    // Vérifier si on est en train de draguer quelque chose
    if (!draggedActivity && !draggedPlannedActivity && !draggedScheduledActivity) {
      return null
    }

    // Vérifier si ce jour est dans la zone de hover
    if (!hoveredSlot || hoveredSlot.day.toDateString() !== day.toDateString()) {
      return null
    }

    let activity: Activity | null = null
    let duration = DEFAULT_ACTIVITY_DURATION // Par défaut 30 minutes

    if (draggedActivity) {
      activity = draggedActivity
      duration = DEFAULT_ACTIVITY_DURATION // Utiliser la durée par défaut pour une nouvelle activité
    } else if (draggedPlannedActivity) {
      activity = activities.find(a => a.id === draggedPlannedActivity.activityId) || null
      // Utiliser la durée de l'activité existante
      const start = timeToMinutes(draggedPlannedActivity.startTime)
      const end = timeToMinutes(draggedPlannedActivity.endTime)
      duration = end - start
    } else if (draggedScheduledActivity) {
      activity = activities.find(a => a.id === draggedScheduledActivity.activityId) || null
      // Utiliser la durée de l'activité existante
      const start = timeToMinutes(draggedScheduledActivity.startTime)
      const end = timeToMinutes(draggedScheduledActivity.endTime)
      duration = end - start
    }

    if (!activity) return null

    // Calculer la position et la hauteur du preview
    const previewStartMinutes = hoveredSlot.hour * 60 + hoveredSlot.minute
    const top = (previewStartMinutes / 60) * SLOT_HEIGHT
    const height = (duration / 60) * SLOT_HEIGHT

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
      // Si la plannedActivity a un scheduledActivityId, on va modifier la scheduledActivity source
      // mais on garde selectedPlannedActivity pour le preview visuel
      if (selectedPlannedActivity.scheduledActivityId) {
        const scheduled = scheduledActivities.find(s => s.id === selectedPlannedActivity.scheduledActivityId)
        if (scheduled) {
          // Mettre à jour la plannedActivity pour le preview visuel
          const updatedPlanned: PlannedActivity = {
            ...selectedPlannedActivity,
            startTime: isResizing === 'top' ? newTime : selectedPlannedActivity.startTime,
            endTime: isResizing === 'bottom' ? newTime : selectedPlannedActivity.endTime,
          }
          
          // Vérifier que endTime > startTime
          const start = timeToMinutes(updatedPlanned.startTime)
          const end = timeToMinutes(updatedPlanned.endTime)
          if (end > start && end - start >= 15) { // Minimum 15 minutes
            setSelectedPlannedActivity(updatedPlanned)
            // On stocke aussi la scheduledActivity mise à jour pour la sauvegarder à la fin
            const updatedScheduled: ScheduledActivity = {
              ...scheduled,
              startTime: isResizing === 'top' ? newTime : scheduled.startTime,
              endTime: isResizing === 'bottom' ? newTime : scheduled.endTime,
            }
            setSelectedScheduledActivity(updatedScheduled)
            // Ne pas appeler onScheduledActivityUpdate ici, seulement à la fin du resize
          }
          return
        }
      }
      
      // Sinon, modifier la plannedActivity normalement
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
      // Si la plannedActivity a un scheduledActivityId, modifier la scheduledActivity source
      if (selectedPlannedActivity.scheduledActivityId) {
        const scheduled = scheduledActivities.find(s => s.id === selectedPlannedActivity.scheduledActivityId)
        if (scheduled && selectedScheduledActivity) {
          onScheduledActivityUpdate?.(selectedScheduledActivity)
        }
      } else {
        onPlannedActivityUpdate?.(selectedPlannedActivity)
      }
    } else if (selectedScheduledActivity) {
      onScheduledActivityUpdate?.(selectedScheduledActivity)
    }
    
    setIsResizing(null)
    setResizeStartY(null)
    setResizeStartTime(null)
  }

  // Gérer les événements globaux pour le resize
  useEffect(() => {
    if (!isResizing) return

    const handleGlobalMouseUp = () => {
      if (isResizing) {
        handleResizeEnd()
      }
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        handleResizeMove(e)
      }
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('mousemove', handleGlobalMouseMove)
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mousemove', handleGlobalMouseMove)
    }
  }, [isResizing, selectedPlannedActivity, selectedScheduledActivity, resizeStartY, resizeStartTime])

  // Synchroniser le state local avec les props après une mise à jour
  useEffect(() => {
    // Synchroniser selectedScheduledActivity avec les props
    if (selectedScheduledActivity && !isResizing) {
      const updated = scheduledActivities.find(s => s.id === selectedScheduledActivity.id)
      if (updated && (
        updated.startTime !== selectedScheduledActivity.startTime ||
        updated.endTime !== selectedScheduledActivity.endTime ||
        updated.dayOfWeek !== selectedScheduledActivity.dayOfWeek
      )) {
        setSelectedScheduledActivity(updated)
      }
    }
    
    // Synchroniser selectedPlannedActivity avec les props
    if (selectedPlannedActivity && !isResizing) {
      const updated = plannedActivities.find(p => p.id === selectedPlannedActivity.id)
      if (updated && (
        updated.startTime !== selectedPlannedActivity.startTime ||
        updated.endTime !== selectedPlannedActivity.endTime ||
        updated.date !== selectedPlannedActivity.date
      )) {
        setSelectedPlannedActivity(updated)
      }
    }
  }, [scheduledActivities, plannedActivities, isResizing])

  const handlePreviousWeek = () => {
    if (!weekStart) return
    const prevWeek = new Date(weekStart)
    prevWeek.setDate(prevWeek.getDate() - 7)
    onWeekChange?.(prevWeek)
  }

  const handleNextWeek = () => {
    if (!weekStart) return
    const nextWeek = new Date(weekStart)
    nextWeek.setDate(nextWeek.getDate() + 7)
    onWeekChange?.(nextWeek)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Sélecteur d'activité - uniquement en mode routine */}
      {mode === 'routine' && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">Glissez une activité vers le planner :</span>
            {activities.map(activity => (
              <button
                key={activity.id}
                draggable
                onDragStart={(e) => handleActivityDragStart(e, activity)}
                onDragEnd={() => {
                  setDraggedActivity(null)
                  setHoveredSlot(null)
                }}
                className="px-3 py-1 rounded transition-all hover:opacity-80 cursor-move"
                style={{
                  backgroundColor: getColorHex(activity.color),
                  color: getTextColor(getColorHex(activity.color)),
                } as React.CSSProperties}
              >
                {activity.title}
              </button>
            ))}
          </div>
        </div>
      )}

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
            // En mode routine, on ne vérifie pas si c'est aujourd'hui (pas de date réelle)
            const isToday = mode === 'calendrier' && day.toDateString() === new Date().toDateString()

            return (
              <div key={dayIndex} className="flex-1 border-r last:border-r-0 relative">
                {/* En-tête du jour */}
                <div
                  className={`h-12 border-b text-center flex flex-col justify-center ${
                    isToday ? 'bg-blue-50 font-semibold' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-sm">{DAYS_OF_WEEK[dayOfWeek]}</div>
                  {mode === 'calendrier' && (
                    <div className="text-xs text-gray-500">
                      {day.getDate()}/{day.getMonth() + 1}
                    </div>
                  )}
                </div>

                {/* Slots horaires */}
                <div className="relative" style={{ height: `${HOURS.length * SLOT_HEIGHT}px` }}>
                  {HOURS.map(hour => {
                    const slots = Array.from({ length: 60 / SLOT_MINUTES }, (_, i) => {
                      const minute = i * SLOT_MINUTES
                      return { hour, minute }
                    })

                    return slots.map((slot) => {
                      return (
                        <div
                          key={`${slot.hour}-${slot.minute}`}
                          className="border-b border-r"
                          style={{
                            height: `${SLOT_HEIGHT / (60 / SLOT_MINUTES)}px`,
                            position: 'relative',
                          }}
                          onDrop={mode === 'routine' ? (e) => handleDrop(e, day, slot.hour, slot.minute) : undefined}
                          onDragOver={mode === 'routine' ? (e) => handleDragOver(e, day, slot.hour, slot.minute) : undefined}
                          onDragLeave={mode === 'routine' ? handleDragLeave : undefined}
                          onClick={() => {
                            // Désélectionner les activités si on clique sur un slot vide
                            setSelectedPlannedActivity(null)
                            setSelectedScheduledActivity(null)
                          }}
                        />
                      )
                    })
                  })}

                  {/* Afficher les activités planifiées - uniquement en mode calendrier */}
                  {mode === 'calendrier' && (() => {
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

                      return (
                        <div
                          key={planned.id}
                          draggable={false}
                          style={{
                            ...style,
                            cursor: 'pointer',
                          }}
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
                              onActivityDoubleClick(activity.id, planned.scheduledActivityId)
                            }
                          }}
                        >
                          <div className="font-medium truncate">{activity?.title}</div>
                          <div className="text-xs opacity-90">
                            {displayPlanned.startTime} - {displayPlanned.endTime}
                          </div>
                        </div>
                      )
                    })
                  })()}

                  {/* Afficher les activités planifiées (scheduled) - uniquement en mode routine */}
                  {mode === 'routine' && (() => {
                    // En mode routine, on affiche uniquement les scheduledActivities basées sur dayOfWeek
                    // Pas besoin de vérifier les plannedActivities car elles n'existent pas en mode routine
                    const dayScheduled = scheduledActivities
                      .filter(s => s.dayOfWeek === dayOfWeek)
                    
                    // Utiliser les activités mises à jour pour le calcul des chevauchements
                    const dayScheduledUpdated: ScheduledActivity[] = dayScheduled
                      .map(s =>
                        (selectedScheduledActivity && selectedScheduledActivity.id === s.id) 
                          ? selectedScheduledActivity 
                          : s
                      )
                      .filter((s): s is ScheduledActivity => s !== null)
                    
                    // Convertir les scheduled en "planned" pour le calcul de chevauchement
                    // En mode routine, on utilise une date fictive pour la structure (mais elle n'est pas affichée)
                    const dateStr = day.toISOString().split('T')[0]
                    const scheduledAsPlanned: PlannedActivity[] = dayScheduledUpdated.map(s => ({
                      id: s.id,
                      activityId: s.activityId,
                      date: dateStr,
                      startTime: s.startTime,
                      endTime: s.endTime,
                      scheduledActivityId: s.id
                    }))
                    
                    // En mode routine, on n'a que les scheduled, pas de planned
                    const allActivitiesForDay: PlannedActivity[] = scheduledAsPlanned
                    
                    const positions = getOverlappingActivities(allActivitiesForDay, day)
                    
                    return dayScheduledUpdated.map(scheduled => {
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
                      const isCurrentlyResizing = isResizing && isSelected

                      return (
                        <div
                          key={scheduled.id}
                          draggable={!isCurrentlyResizing}
                          onDragStart={(e) => {
                            if (isCurrentlyResizing) {
                              e.preventDefault()
                              return
                            }
                            handleScheduledActivityDragStart(e, scheduled)
                          }}
                          onDragEnd={() => {
                            setDraggedScheduledActivity(null)
                            setHoveredSlot(null)
                          }}
                          onDragOver={(e) => handleActivityDragOver(e, day, scheduled.id)}
                          onDrop={(e) => handleActivityDrop(e, day, scheduled.id)}
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
                            borderWidth: isSelected ? '2px' : '1px',
                            borderStyle: isSelected ? 'solid' : 'dashed',
                            borderColor: getTextColor(getColorHex(activity.color)),
                            zIndex: isSelected ? 15 : 5,
                            cursor: isCurrentlyResizing ? 'ns-resize' : 'move',
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
                              onActivityDoubleClick(activity.id, scheduled.id)
                            }
                          }}
                        >
                          {/* Poignée de redimensionnement en haut */}
                          {isSelected && activity && (
                            <div
                              className="absolute left-1/2 transform -translate-x-1/2 cursor-ns-resize z-20"
                              onMouseDown={(e) => handleResizeStart(e, scheduled, 'top')}
                              style={{
                                top: '-3px',
                                width: '40px',
                                height: '6px',
                                backgroundColor: getTextColor(getColorHex(activity.color)),
                                borderRadius: '3px',
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
                              className="absolute left-1/2 transform -translate-x-1/2 cursor-ns-resize z-20"
                              onMouseDown={(e) => handleResizeStart(e, scheduled, 'bottom')}
                              style={{
                                bottom: '-3px',
                                width: '40px',
                                height: '6px',
                                backgroundColor: getTextColor(getColorHex(activity.color)),
                                borderRadius: '3px',
                              }}
                            />
                          )}
                        </div>
                      )
                    })
                  })()}

                  {/* Preview du hover (affiché après toutes les activités pour être au-dessus) */}
                  {(() => {
                    const previewStyle = getHoverPreviewStyle(day)
                    return previewStyle ? <div key="hover-preview" style={previewStyle} /> : null
                  })()}

                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation de semaine - uniquement en mode calendrier */}
      {mode === 'calendrier' && (
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={handlePreviousWeek}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            ← Semaine précédente
          </button>
          <div className="text-sm font-medium">
            {weekStart && `Semaine du ${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          </div>
          <button
            onClick={handleNextWeek}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            Semaine suivante →
          </button>
        </div>
      )}
    </div>
  )
}
