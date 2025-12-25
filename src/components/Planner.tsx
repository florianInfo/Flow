import { useState, useMemo, useRef, useEffect } from 'react'
import { Activity } from '../models/Activity'
import { ScheduledActivity, PlannedActivity } from '../models/Planning'
import { useAppSettings } from '../hooks/useAppSettings'
import { timeToMinutes, minutesToTime, adjustTimeBounds } from '../utils/TimeUtils'
import { getWeekStart, generateWeekDays, generateRoutineWeekDays } from '../utils/DateUtils'
import { getSlotFromMousePosition, PlannerDimensions, detectScrollZone, validateDuration } from '../utils/PlannerPositionUtils'
import { preparePlannedActivitiesForDay, prepareScheduledActivitiesForDay } from '../utils/PlannerActivityUtils'
import { calculateHoverPreviewStyle } from '../utils/PlannerStyleUtils'
import ActivityBlock from './ActivityBlock'
import PlannerIcon from './PlannerIcon'
import CalendarIcon from './CalendarIcon'

type PlannerMode = 'routine' | 'calendrier'

const DAYS_OF_WEEK = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

interface PlannerProps {
  activities: Activity[]
  scheduledActivities: ScheduledActivity[]
  plannedActivities: PlannedActivity[]
  onScheduledActivityCreate?: (scheduled: ScheduledActivity, day?: Date) => void
  onScheduledActivityUpdate?: (scheduled: ScheduledActivity) => void
  onScheduledActivityDelete?: (scheduledActivityId: number) => void
  onPlannedActivityUpdate?: (planned: PlannedActivity) => void
  currentWeek?: Date
  onWeekChange?: (weekStart: Date) => void
  onActivityDoubleClick?: (activityId: number, scheduledActivityId?: number, mode?: PlannerMode) => void
  draggedActivity?: Activity | null
  onDragEnd?: () => void
  onModeChange?: (mode: PlannerMode) => void
}

export default function Planner({
  activities,
  scheduledActivities,
  plannedActivities,
  onScheduledActivityCreate,
  onScheduledActivityUpdate,
  onScheduledActivityDelete,
  onPlannedActivityUpdate,
  currentWeek = new Date(),
  onWeekChange,
  onActivityDoubleClick,
  draggedActivity: externalDraggedActivity,
  onDragEnd,
  onModeChange,
}: PlannerProps) {
  const { settings } = useAppSettings()
  
  // Gestion interne du mode
  const [mode, setMode] = useState<PlannerMode>('routine')
  
  // Notifier le parent du changement de mode
  useEffect(() => {
    onModeChange?.(mode)
  }, [mode, onModeChange])
  const [internalCurrentWeek, setInternalCurrentWeek] = useState<Date>(currentWeek)
  
  // Synchroniser avec currentWeek si fourni en prop
  useEffect(() => {
    if (currentWeek) {
      setInternalCurrentWeek(currentWeek)
    }
  }, [currentWeek])
  
  // Gérer le changement de semaine en interne
  const handleInternalWeekChange = (weekStart: Date) => {
    setInternalCurrentWeek(weekStart)
    onWeekChange?.(weekStart)
  }
  
  // Paramètres dynamiques du planner
  const START_HOUR = settings.planner.startHour
  const END_HOUR = settings.planner.endHour
  const SLOT_HEIGHT = settings.planner.slotHeight
  const SLOT_MINUTES = settings.planner.slotMinutes
  const DEFAULT_ACTIVITY_DURATION = settings.planner.defaultActivityDuration
  const SCROLL_THRESHOLD = settings.planner.scrollThreshold
  
  // Calculer les heures dynamiquement
  const HOURS = useMemo(() => {
    return Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR)
  }, [START_HOUR, END_HOUR])

  // Utiliser l'activité draguée depuis les props si fournie, sinon état local
  const [internalDraggedActivity, setInternalDraggedActivity] = useState<Activity | null>(null)
  const draggedActivity = externalDraggedActivity ?? internalDraggedActivity
  const [draggedPlannedActivity, setDraggedPlannedActivity] = useState<PlannedActivity | null>(null) // Activité planifiée draguée
  const [draggedScheduledActivity, setDraggedScheduledActivity] = useState<ScheduledActivity | null>(null) // Activité scheduled draguée
  const [hoveredSlot, setHoveredSlot] = useState<{ day: Date; hour: number; minute: number } | null>(null)
  const [selectedPlannedActivity, setSelectedPlannedActivity] = useState<PlannedActivity | null>(null)
  const [selectedScheduledActivity, setSelectedScheduledActivity] = useState<ScheduledActivity | null>(null)
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null)
  const [resizeStartY, setResizeStartY] = useState<number | null>(null)
  const [resizeStartTime, setResizeStartTime] = useState<string | null>(null)
  const [resizeStartScrollTop, setResizeStartScrollTop] = useState<number | null>(null)
  const [scrollCursor, setScrollCursor] = useState<'up' | 'down' | null>(null)
  const plannerRef = useRef<HTMLDivElement>(null)

  // Calculer le début de la semaine (lundi) - uniquement en mode calendrier
  const weekStart = useMemo(() => {
    if (mode === 'routine') {
      // En mode routine, on n'utilise pas de dates réelles
      return null
    }
    return getWeekStart(internalCurrentWeek)
  }, [internalCurrentWeek, mode])

  // Générer les jours de la semaine
  const weekDays = useMemo(() => {
    if (mode === 'routine') {
      // En mode routine, on génère juste les jours de la semaine (1 = lundi, 7 = dimanche)
      // On utilise des dates fictives pour la structure, mais on ne les affiche pas
      return generateRoutineWeekDays()
    }
    // En mode calendrier, on utilise les dates réelles
    return generateWeekDays(weekStart!)
  }, [weekStart, mode])

  // Gérer le drag d'une activité scheduled existante
  const handleScheduledActivityDragStart = (e: React.DragEvent, scheduled: ScheduledActivity) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('scheduledActivity', JSON.stringify(scheduled))
    setDraggedScheduledActivity(scheduled)
    setSelectedScheduledActivity(scheduled)
    setSelectedPlannedActivity(null)
  }


  // Fonction utilitaire pour nettoyer après un drop
  const cleanupAfterDrop = () => {
    if (!externalDraggedActivity) {
      setInternalDraggedActivity(null)
    }
    onDragEnd?.()
    setHoveredSlot(null)
    setScrollCursor(null)
  }

  // Handler pour créer une nouvelle activité scheduled
  const handleNewActivityDrop = (
    activity: Activity, 
    day: Date, 
    hour: number, 
    minute: number
  ) => {
    const adjusted = adjustTimeBounds(hour, minute, DEFAULT_ACTIVITY_DURATION, START_HOUR, END_HOUR)
    if (!adjusted) return
    
    const { startMinutes, endMinutes } = adjusted
    const newScheduled: ScheduledActivity = {
      activityId: activity.id!,
      startTime: minutesToTime(startMinutes),
      endTime: minutesToTime(endMinutes),
      dayOfWeek: day.getDay(),
    }
    onScheduledActivityCreate?.(newScheduled, day)
    cleanupAfterDrop()
  }

  // Handler pour déplacer une PlannedActivity
  const handlePlannedActivityDrop = (
    planned: PlannedActivity,
    day: Date,
    hour: number,
    minute: number
  ) => {
    const duration = timeToMinutes(planned.endTime) - timeToMinutes(planned.startTime)
    const adjusted = adjustTimeBounds(hour, minute, duration, START_HOUR, END_HOUR)
    if (!adjusted) return
    
    const { startMinutes, endMinutes } = adjusted
    
    // Si la plannedActivity a un scheduledActivityId, modifier la scheduledActivity source
    if (planned.scheduledActivityId) {
      const scheduled = scheduledActivities.find(s => s.id === planned.scheduledActivityId)
      if (scheduled) {
        const updated: ScheduledActivity = {
          ...scheduled,
          startTime: minutesToTime(startMinutes),
          endTime: minutesToTime(endMinutes),
          dayOfWeek: day.getDay(),
        }
        onScheduledActivityUpdate?.(updated)
        setDraggedPlannedActivity(null)
        setHoveredSlot(null)
        return
      }
    }
    
    // Sinon, modifier la plannedActivity normalement
    const updated: PlannedActivity = {
      ...planned,
      date: day.toISOString().split('T')[0],
      startTime: minutesToTime(startMinutes),
      endTime: minutesToTime(endMinutes),
    }
    onPlannedActivityUpdate?.(updated)
    setDraggedPlannedActivity(null)
    setHoveredSlot(null)
  }

  // Handler pour déplacer une ScheduledActivity
  const handleScheduledActivityDrop = (
    scheduled: ScheduledActivity,
    day: Date,
    hour: number,
    minute: number
  ) => {
    const duration = timeToMinutes(scheduled.endTime) - timeToMinutes(scheduled.startTime)
    const adjusted = adjustTimeBounds(hour, minute, duration, START_HOUR, END_HOUR)
    if (!adjusted) return
    
    const { startMinutes, endMinutes } = adjusted
    const dayOfWeek = day.getDay()
    
    const updated: ScheduledActivity = {
      ...scheduled,
      startTime: minutesToTime(startMinutes),
      endTime: minutesToTime(endMinutes),
      // Ne mettre à jour dayOfWeek que si ce n'est pas une activité quotidienne
      ...(scheduled.periodicity?.unit === 'daily' && scheduled.periodicity.frequency < 7 
        ? {} 
        : { dayOfWeek }),
    }
    onScheduledActivityUpdate?.(updated)
    setDraggedScheduledActivity(null)
    setHoveredSlot(null)
  }

  // Gérer le drop sur un slot
  const handleDrop = (e: React.DragEvent, day: Date, hour: number, minute: number) => {
    e.preventDefault()
    e.stopPropagation()

    // Utiliser d'abord l'état local (plus fiable que dataTransfer)
    if (draggedActivity) {
      handleNewActivityDrop(draggedActivity, day, hour, minute)
      return
    }

    if (draggedPlannedActivity) {
      handlePlannedActivityDrop(draggedPlannedActivity, day, hour, minute)
      return
    }

    if (draggedScheduledActivity) {
      handleScheduledActivityDrop(draggedScheduledActivity, day, hour, minute)
      return
    }

    // Fallback : essayer de récupérer depuis dataTransfer (pour compatibilité)
    const activityData = e.dataTransfer.getData('activity')
    if (activityData) {
      try {
        const activity: Activity = JSON.parse(activityData)
        handleNewActivityDrop(activity, day, hour, minute)
      } catch (error) {
        console.error('Erreur lors de la désérialisation de l\'activité:', error)
      }
      return
    }

    const plannedData = e.dataTransfer.getData('plannedActivity')
    if (plannedData) {
      try {
        const planned: PlannedActivity = JSON.parse(plannedData)
        handlePlannedActivityDrop(planned, day, hour, minute)
      } catch (error) {
        console.error('Erreur lors de la désérialisation de la plannedActivity:', error)
      }
      return
    }

    const scheduledData = e.dataTransfer.getData('scheduledActivity')
    if (scheduledData) {
      try {
        const scheduled: ScheduledActivity = JSON.parse(scheduledData)
        handleScheduledActivityDrop(scheduled, day, hour, minute)
      } catch (error) {
        console.error('Erreur lors de la désérialisation de la scheduledActivity:', error)
      }
    }
  }

  // Gérer le drag over pour le hover avec throttling pour éviter les tremblements
  const handleDragOver = (e: React.DragEvent, day: Date, hour: number, minute: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Détecter si on est dans la zone de scroll
    if (plannerRef.current) {
      const rect = plannerRef.current.getBoundingClientRect()
      const mouseYRelativeToViewport = e.clientY - rect.top
      
      if (mouseYRelativeToViewport < SCROLL_THRESHOLD && plannerRef.current.scrollTop > 0) {
        setScrollCursor('up')

      } else if (mouseYRelativeToViewport > rect.height - SCROLL_THRESHOLD) {
        const maxScroll = plannerRef.current.scrollHeight - plannerRef.current.clientHeight
        if (plannerRef.current.scrollTop < maxScroll) {
          setScrollCursor('down')
        } else {
          setScrollCursor(null)
        }
      } else {
        setScrollCursor(null)
      }
    }
    
    // Utiliser requestAnimationFrame pour améliorer la fluidité
    requestAnimationFrame(() => {
      setHoveredSlot({ day, hour, minute })
    })
  }


  // Gérer le drag over sur une activité avec throttling pour éviter les tremblements
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
    
    // Détecter si on est dans la zone de scroll
    if (plannerRef.current) {
      const rect = plannerRef.current.getBoundingClientRect()
      const mouseYRelativeToViewport = e.clientY - rect.top
      const scrollZone = detectScrollZone(
        mouseYRelativeToViewport,
        rect.height,
        plannerRef.current.scrollTop,
        plannerRef.current.scrollHeight,
        plannerRef.current.clientHeight,
        SCROLL_THRESHOLD
      )
      setScrollCursor(scrollZone)
    }
    
    // Utiliser requestAnimationFrame pour améliorer la fluidité
    requestAnimationFrame(() => {
      if (!plannerRef.current) return
      const rect = plannerRef.current.getBoundingClientRect()
      const dimensions: PlannerDimensions = {
        slotHeight: SLOT_HEIGHT,
        slotMinutes: SLOT_MINUTES,
        startHour: START_HOUR,
        endHour: END_HOUR,
        headerHeight: 48
      }
      const slot = getSlotFromMousePosition(e.clientY, rect, plannerRef.current.scrollTop, dimensions)
      if (slot) {
        setHoveredSlot({ day, hour: slot.hour, minute: slot.minute })
      }
    })
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
    
    if (!plannerRef.current) return
    const rect = plannerRef.current.getBoundingClientRect()
    const dimensions: PlannerDimensions = {
      slotHeight: SLOT_HEIGHT,
      slotMinutes: SLOT_MINUTES,
      startHour: START_HOUR,
      endHour: END_HOUR,
      headerHeight: 48
    }
    const slot = getSlotFromMousePosition(e.clientY, rect, plannerRef.current.scrollTop, dimensions)
    if (slot) {
      handleDrop(e, day, slot.hour, slot.minute)
    }
  }

  // Gérer le drag leave
  const handleDragLeave = () => {
    setHoveredSlot(null)
    setScrollCursor(null)
  }



  // Gérer le redimensionnement d'une activité
  const handleResizeStart = (e: React.MouseEvent, activity: PlannedActivity | ScheduledActivity, edge: 'top' | 'bottom') => {
    e.stopPropagation()
    setIsResizing(edge)
    setResizeStartY(e.clientY)
    
    // Stocker le scroll initial pour prendre en compte le scroll lors du redimensionnement
    if (plannerRef.current) {
      setResizeStartScrollTop(plannerRef.current.scrollTop)
    } else {
      setResizeStartScrollTop(0)
    }
    if ('date' in activity) {
      setResizeStartTime(edge === 'top' ? activity.startTime : activity.endTime)
      setSelectedPlannedActivity(activity as PlannedActivity)
    } else {
      setResizeStartTime(edge === 'top' ? activity.startTime : activity.endTime)
      setSelectedScheduledActivity(activity as ScheduledActivity)
    }
  }

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeStartY || !resizeStartTime || !plannerRef.current || resizeStartScrollTop === null) return

    const rect = plannerRef.current.getBoundingClientRect()
    
    // Détecter si on est dans la zone de scroll (le scroll sera géré par l'effet)
    const mouseYRelativeToViewport = e.clientY - rect.top
    const scrollZone = detectScrollZone(
      mouseYRelativeToViewport,
      rect.height,
      plannerRef.current.scrollTop,
      plannerRef.current.scrollHeight,
      plannerRef.current.clientHeight,
      SCROLL_THRESHOLD
    )
    setScrollCursor(scrollZone)
    
    // Prendre en compte le scroll actuel pour calculer la position relative correcte
    // Le header sticky a une hauteur de 48px (h-12)
    // e.clientY - rect.top donne la position dans la zone visible (incluant le header)
    // On soustrait la hauteur du header et on ajoute scrollTop pour obtenir la position absolue dans le contenu scrollé
    const HEADER_HEIGHT = 48 // h-12 = 48px
    const currentScrollTop = plannerRef.current.scrollTop
    const relativeY = e.clientY - rect.top - HEADER_HEIGHT + currentScrollTop
    const totalMinutes = (relativeY / SLOT_HEIGHT) * 60
    const hour = Math.floor(totalMinutes / 60) + START_HOUR
    const minute = Math.floor((totalMinutes % 60) / SLOT_MINUTES) * SLOT_MINUTES

    // Permettre jusqu'à 23:00 pour le resize (END_HOUR + 1)
    if (hour < START_HOUR || hour > END_HOUR + 1) return
    // Limiter à 23:00 maximum
    if (hour === END_HOUR + 1 && minute > 0) return

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
          
          // Vérifier que endTime > startTime et que l'activité ne dépasse pas 23:00
          if (validateDuration(updatedPlanned.startTime, updatedPlanned.endTime, END_HOUR, timeToMinutes)) {
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
      
      // Vérifier que endTime > startTime et que l'activité ne dépasse pas 23:00
      if (validateDuration(updated.startTime, updated.endTime, END_HOUR, timeToMinutes)) {
        setSelectedPlannedActivity(updated)
        // Ne pas appeler onPlannedActivityUpdate ici, seulement à la fin du resize
      }
    } else if (selectedScheduledActivity) {
      const updated: ScheduledActivity = {
        ...selectedScheduledActivity,
        startTime: isResizing === 'top' ? newTime : selectedScheduledActivity.startTime,
        endTime: isResizing === 'bottom' ? newTime : selectedScheduledActivity.endTime,
      }
      
      // Vérifier que endTime > startTime et que l'activité ne dépasse pas 23:00
      if (validateDuration(updated.startTime, updated.endTime, END_HOUR, timeToMinutes)) {
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
    setResizeStartScrollTop(null)
    setScrollCursor(null)
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
  }, [isResizing, selectedPlannedActivity, selectedScheduledActivity, resizeStartY, resizeStartTime, resizeStartScrollTop])

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
    handleInternalWeekChange(prevWeek)
  }

  const handleNextWeek = () => {
    if (!weekStart) return
    const nextWeek = new Date(weekStart)
    nextWeek.setDate(nextWeek.getDate() + 7)
    handleInternalWeekChange(nextWeek)
  }
  
  // Réinitialiser la semaine quand on passe en mode routine
  useEffect(() => {
    if (mode === 'routine') {
      setInternalCurrentWeek(new Date())
    }
  }, [mode])

  // Scroll automatique quand le curseur est dans la zone de scroll
  useEffect(() => {
    if (!scrollCursor || !plannerRef.current) return

    const SCROLL_SPEED = 5 // Vitesse de scroll en pixels par frame
    let animationFrameId: number | null = null

    const scroll = () => {
      if (!plannerRef.current || !scrollCursor) {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
        return
      }

      if (scrollCursor === 'up' && plannerRef.current.scrollTop > 0) {
        plannerRef.current.scrollTop = Math.max(0, plannerRef.current.scrollTop - SCROLL_SPEED)
        animationFrameId = requestAnimationFrame(scroll)
      } else if (scrollCursor === 'down') {
        const maxScroll = plannerRef.current.scrollHeight - plannerRef.current.clientHeight
        if (plannerRef.current.scrollTop < maxScroll) {
          plannerRef.current.scrollTop = Math.min(maxScroll, plannerRef.current.scrollTop + SCROLL_SPEED)
          animationFrameId = requestAnimationFrame(scroll)
        }
      }
    }

    animationFrameId = requestAnimationFrame(scroll)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [scrollCursor])

  return (
    <div className="flex flex-col h-full overflow-hidden pb-6">
      {/* Planner */}
      <div className="flex-1 flex flex-col bg-white min-h-0">
        {/* Zone scrollable avec les heures et les slots */}
        <div 
          className="flex-1 overflow-auto" 
          ref={plannerRef} 
          style={{ 
            minHeight: 0,
            cursor: scrollCursor === 'up' ? 'n-resize' : scrollCursor === 'down' ? 's-resize' : undefined
          }}
        >
          {/* Header sticky avec les jours */}
          <div className="flex border-b sticky top-0 z-20 flex-shrink-0" style={{ boxSizing: 'border-box', width: '100%', background: 'linear-gradient(to bottom, rgba(234, 221, 205, 1), rgba(234, 221, 205, 0.25))' }}>
            {/* Colonne des heures - sélecteur de mode */}
            <div className="w-20 flex-shrink-0 border-r relative" style={{ boxSizing: 'border-box', background: 'linear-gradient(to bottom, rgba(234, 221, 205, 1), rgba(234, 221, 205, 0.25))' }}>
              <div className="h-12 grid grid-cols-2 grid-rows-2 relative" style={{ border: 'none' }}>
                {/* Barre diagonale traversant les cellules haut droite et bas gauche */}
                <div 
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{
                    background: 'linear-gradient(to bottom right, transparent calc(50% - 1px), #9ca3af calc(50% - 1px), #9ca3af calc(50% + 1px), transparent calc(50% + 1px))',
                  }}
                />
                
                {/* Cellule haut gauche - Mode Routine */}
                <div className="flex items-center justify-center relative z-10">
                  <button
                    onClick={() => setMode('routine')}
                    className={`flex items-center justify-center transition-all rounded-xl ${
                      mode === 'routine' 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-transparent hover:bg-gray-200'
                    }`}
                    style={{ width: '24px', height: '24px' }}
                    title="Mode Routine"
                  >
                    <PlannerIcon isActive={mode === 'routine'} />
                  </button>
                </div>
                
                {/* Cellule haut droite - vide (barre diagonale visible) */}
                <div className="relative z-10"></div>
                
                {/* Cellule bas gauche - vide (barre diagonale visible) */}
                <div className="relative z-10"></div>
                
                {/* Cellule bas droite - Mode Calendrier */}
                <div className="flex items-center justify-center relative z-10">
                  <button
                    onClick={() => setMode('calendrier')}
                    className={`flex items-center justify-center transition-all rounded-xl ${
                      mode === 'calendrier' 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-transparent hover:bg-gray-200'
                    }`}
                    style={{ width: '24px', height: '24px' }}
                    title="Mode Calendrier"
                  >
                    <CalendarIcon isActive={mode === 'calendrier'} />
                  </button>
                </div>
              </div>
            </div>

            {/* En-têtes des jours */}
            {weekDays.map((day, dayIndex) => {
              const dayOfWeek = day.getDay()
              // En mode routine, on ne vérifie pas si c'est aujourd'hui (pas de date réelle)
              const isToday = mode === 'calendrier' && day.toDateString() === new Date().toDateString()

              return (
                <div
                  key={dayIndex}
                  className={`flex-1 border-r last:border-r-0 h-12 text-center flex flex-col justify-center ${
                    isToday ? 'font-semibold' : ''
                  }`}
                  style={{ 
                    boxSizing: 'border-box',
                    background: isToday 
                      ? 'linear-gradient(to bottom, rgb(255, 255, 255), rgba(255, 255, 255, 0.25))'
                      : 'linear-gradient(to bottom, rgb(255, 255, 255), rgba(255, 255, 255, 0.25))'
                  }}
                >
                  <div className="text-sm">{DAYS_OF_WEEK[dayOfWeek]}</div>
                  {mode === 'calendrier' && (
                    <div className="text-xs text-gray-500">
                      {day.getDate()}/{day.getMonth() + 1}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex">
            {/* Colonne des heures */}
            <div className="w-20 flex-shrink-0 border-r">
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="border-b-2"
                  style={{ height: `${SLOT_HEIGHT}px` }}
                >
                  <div className="text-xs text-gray-500 p-1">{hour}h</div>
                </div>
              ))}
              {/* Slot supplémentaire pour 23h (invisible mais présent pour le resize) */}
              <div
                className="border-b"
                style={{ height: `${SLOT_HEIGHT}px` }}
              >
                <div className="text-xs text-gray-500 p-1 opacity-0">23h</div>
              </div>
            </div>

            {/* Colonnes des jours */}
            {weekDays.map((day, dayIndex) => {
              const dayOfWeek = day.getDay()

              return (
                <div key={dayIndex} className="flex-1 border-r last:border-r-0 relative">
                  {/* Slots horaires */}
                  <div className="relative" style={{ height: `${(HOURS.length + 1) * SLOT_HEIGHT}px` }}>
                  {HOURS.map(hour => {
                    const slots = Array.from({ length: 60 / SLOT_MINUTES }, (_, i) => {
                      const minute = i * SLOT_MINUTES
                      return { hour, minute }
                    })

                    return slots.map((slot) => {
                      return (
                        <div
                          key={`${slot.hour}-${slot.minute}`}
                          className={`border-r ${slot.minute === 45 ? 'border-b-2' : slot.minute === 15 ? 'border-b' : slot.minute === 45 ? 'border-b-2' : 'border-b border-dashed'}`}
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
                  {mode === 'calendrier' && preparePlannedActivitiesForDay(
                    plannedActivities,
                    day,
                    selectedPlannedActivity,
                    activities,
                    START_HOUR,
                    SLOT_HEIGHT
                  ).map(({ planned, activity, position, isSelected }) => (
                    <ActivityBlock
                      key={planned.id}
                      activity={activity}
                      planned={planned}
                      position={position}
                      isSelected={isSelected}
                      mode={mode}
                      onSelect={(e) => {
                        e.stopPropagation()
                        setSelectedPlannedActivity(planned)
                        setSelectedScheduledActivity(null)
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        if (activity.id && onActivityDoubleClick) {
                          onActivityDoubleClick(activity.id, planned.scheduledActivityId, mode)
                        }
                      }}
                      style={{ cursor: 'default' }}
                    />
                  ))}

                  {/* Afficher les activités planifiées (scheduled) - uniquement en mode routine */}
                  {mode === 'routine' && prepareScheduledActivitiesForDay(
                    scheduledActivities,
                    day,
                    dayOfWeek,
                    selectedScheduledActivity,
                    activities,
                    START_HOUR,
                    SLOT_HEIGHT
                  ).map(({ scheduled, activity, position, isSelected }) => {
                    const isCurrentlyResizing = isResizing && isSelected
                    return (
                      <ActivityBlock
                        key={scheduled.id}
                        activity={activity}
                        scheduled={scheduled}
                        position={position}
                        isSelected={isSelected}
                        isResizing={isCurrentlyResizing || undefined}
                        mode={mode}
                        onSelect={(e) => {
                          e.stopPropagation()
                          setSelectedScheduledActivity(scheduled)
                          setSelectedPlannedActivity(null)
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          if (activity.id && onActivityDoubleClick) {
                            onActivityDoubleClick(activity.id, scheduled.id, mode)
                          }
                        }}
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
                          setScrollCursor(null)
                        }}
                        onDragOver={(e) => handleActivityDragOver(e, day, scheduled.id)}
                        onDrop={(e) => handleActivityDrop(e, day, scheduled.id)}
                        onResizeStart={(e, edge) => handleResizeStart(e, scheduled, edge)}
                        onDelete={() => {
                          if (scheduled.id !== undefined && onScheduledActivityDelete) {
                            onScheduledActivityDelete(scheduled.id)
                            setSelectedScheduledActivity(null)
                          }
                        }}
                      />
                    )
                  })}

                  {/* Preview du hover (affiché après toutes les activités pour être au-dessus) */}
                  {(() => {
                    const previewStyle = calculateHoverPreviewStyle(
                      day,
                      hoveredSlot,
                      draggedActivity,
                      draggedPlannedActivity,
                      draggedScheduledActivity,
                      activities,
                      DEFAULT_ACTIVITY_DURATION,
                      START_HOUR,
                      END_HOUR,
                      SLOT_HEIGHT,
                      timeToMinutes,
                      minutesToTime
                    )
                    return previewStyle ? <div key="hover-preview" style={previewStyle} /> : null
                  })()}

                  {/* Zone invisible après le calendrier pour permettre le drag/resize au-delà de la zone visible */}
                  <div
                    className="absolute left-0 right-0 pointer-events-auto"
                    style={{
                      top: `${HOURS.length * SLOT_HEIGHT}px`,
                      height: `${SLOT_HEIGHT}px`, // Une heure supplémentaire pour permettre jusqu'à 23:00
                      zIndex: 1,
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      // Calculer la position pour 23:00
                      requestAnimationFrame(() => {
                        setHoveredSlot({ day, hour: END_HOUR + 1, minute: 0 })
                      })
                    }}
                    onDrop={(e) => {
                      handleDrop(e, day, END_HOUR + 1, 0)
                    }}
                  />

                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Navigation de semaine - uniquement en mode calendrier */}
      {mode === 'calendrier' && (
        <div className="p-2 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={handlePreviousWeek}
            className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
          >
            ← Semaine précédente
          </button>
          <div className="text-sm font-medium">
            {weekStart && `Semaine du ${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          </div>
          <button
            onClick={handleNextWeek}
            className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
          >
            Semaine suivante →
          </button>
        </div>
      )}
    </div>
  )
}
