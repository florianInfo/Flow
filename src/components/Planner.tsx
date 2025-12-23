import { useState, useMemo, useRef, useEffect } from 'react'
import { Activity } from '../models/Activity'
import { ScheduledActivity, PlannedActivity } from '../models/Planning'
import { getColorHex, getTextColor } from '../utils/ColorUtils'
import { useAppSettings } from '../hooks/useAppSettings'

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
  onActivityDoubleClick?: (activityId: number, scheduledActivityId?: number) => void
}

// Composant pour l'icône Planner (carnet de note)
const PlannerIcon = ({ isActive }: { isActive: boolean }) => {
  const color = isActive ? "#1f2937" : "#6b7280"
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Carnet de note */}
      <rect x="5" y="4" width="14" height="17" rx="1.5" stroke={color} strokeWidth="1.5" fill="white"/>
      {/* Spirale à gauche */}
      <circle cx="5" cy="6" r="0.8" fill={color}/>
      <circle cx="5" cy="9" r="0.8" fill={color}/>
      <circle cx="5" cy="12" r="0.8" fill={color}/>
      <circle cx="5" cy="15" r="0.8" fill={color}/>
      <circle cx="5" cy="18" r="0.8" fill={color}/>
      {/* Lignes de texte */}
      <line x1="8" y1="7" x2="15" y2="7" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="8" y1="10" x2="15" y2="10" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="8" y1="13" x2="13" y2="13" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="8" y1="16" x2="14" y2="16" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

// Composant pour l'icône Calendrier
const CalendarIcon = ({ isActive }: { isActive: boolean }) => {
  const color = isActive ? "white" : "#6b7280"
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
      <path d="M7.5 10.5h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0 -2Z" fill={color} strokeWidth="1"></path>
      <path d="M12.5 10.5h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0 -2Z" fill={color} strokeWidth="1"></path>
      <path d="M17.5 10.5h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0 -2Z" fill={color} strokeWidth="1"></path>
      <path d="M7.5 14.5h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0 -2Z" fill={color} strokeWidth="1"></path>
      <path d="M12.5 14.5h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0 -2Z" fill={color} strokeWidth="1"></path>
      <path d="M17.5 14.5h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0 -2Z" fill={color} strokeWidth="1"></path>
      <path d="M7.5 18.5h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0 -2Z" fill={color} strokeWidth="1"></path>
      <path d="M12.5 18.5h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0 -2Z" fill={color} strokeWidth="1"></path>
      <path d="M17.5 18.5h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0 -2Z" fill={color} strokeWidth="1"></path>
      <path d="M21.5 3h-2.75a0.25 0.25 0 0 1 -0.25 -0.25V1a1 1 0 0 0 -2 0v4.75a0.75 0.75 0 0 1 -1.5 0V3.5a0.5 0.5 0 0 0 -0.5 -0.5H8.25A0.25 0.25 0 0 1 8 2.75V1a1 1 0 0 0 -2 0v4.75a0.75 0.75 0 0 1 -1.5 0V3.5A0.5 0.5 0 0 0 4 3H2.5a2 2 0 0 0 -2 2v17a2 2 0 0 0 2 2h19a2 2 0 0 0 2 -2V5a2 2 0 0 0 -2 -2Zm0 18.5a0.5 0.5 0 0 1 -0.5 0.5H3a0.5 0.5 0 0 1 -0.5 -0.5v-12A0.5 0.5 0 0 1 3 9h18a0.5 0.5 0 0 1 0.5 0.5Z" fill={color} strokeWidth="1"></path>
    </svg>
  )
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
}: PlannerProps) {
  const { settings } = useAppSettings()
  
  // Gestion interne du mode
  const [mode, setMode] = useState<PlannerMode>('routine')
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
  
  // Calculer les heures dynamiquement
  const HOURS = useMemo(() => {
    return Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR)
  }, [START_HOUR, END_HOUR])

  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null) // Activité draguée depuis la liste
  const [draggedPlannedActivity, setDraggedPlannedActivity] = useState<PlannedActivity | null>(null) // Activité planifiée draguée
  const [draggedScheduledActivity, setDraggedScheduledActivity] = useState<ScheduledActivity | null>(null) // Activité scheduled draguée
  const [hoveredSlot, setHoveredSlot] = useState<{ day: Date; hour: number; minute: number } | null>(null)
  const [selectedPlannedActivity, setSelectedPlannedActivity] = useState<PlannedActivity | null>(null)
  const [selectedScheduledActivity, setSelectedScheduledActivity] = useState<ScheduledActivity | null>(null)
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null)
  const [resizeStartY, setResizeStartY] = useState<number | null>(null)
  const [resizeStartTime, setResizeStartTime] = useState<string | null>(null)
  const [resizeStartScrollTop, setResizeStartScrollTop] = useState<number | null>(null)
  const plannerRef = useRef<HTMLDivElement>(null)

  // Calculer le début de la semaine (lundi) - uniquement en mode calendrier
  const weekStart = useMemo(() => {
    if (mode === 'routine') {
      // En mode routine, on n'utilise pas de dates réelles
      return null
    }
    const start = new Date(internalCurrentWeek)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Ajuster pour lundi
    return new Date(start.setDate(diff))
  }, [internalCurrentWeek, mode])

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

    // Utiliser d'abord l'état local (plus fiable que dataTransfer)
    if (draggedActivity) {
      let startMinutes = hour * 60 + minute
      let endMinutes = startMinutes + DEFAULT_ACTIVITY_DURATION
      const maxMinutes = (END_HOUR + 1) * 60 // 23:00 = 1380 minutes
      const minMinutes = START_HOUR * 60 // 6:00 = 360 minutes
      
      // Ajuster si l'activité dépasse 23:00 : proposer le dernier créneau possible
      if (endMinutes > maxMinutes) {
        endMinutes = maxMinutes
        startMinutes = endMinutes - DEFAULT_ACTIVITY_DURATION
      }
      
      // Ajuster si l'activité commence avant 6:00 : proposer le premier créneau possible
      if (startMinutes < minMinutes) {
        startMinutes = minMinutes
        endMinutes = startMinutes + DEFAULT_ACTIVITY_DURATION
        // Si après ajustement, ça dépasse encore 23:00, limiter à 23:00
        if (endMinutes > maxMinutes) {
          endMinutes = maxMinutes
          startMinutes = endMinutes - DEFAULT_ACTIVITY_DURATION
          // Si la durée est trop grande, ne pas permettre le drop
          if (startMinutes < minMinutes) {
            return
          }
        }
      }
      
      const startTime = minutesToTime(startMinutes)
      const endTime = minutesToTime(endMinutes)
      const newScheduled: ScheduledActivity = {
        activityId: draggedActivity.id!,
        startTime,
        endTime,
        dayOfWeek,
        // Calculer la semaine du mois pour monthly (sera utilisé si l'utilisateur change en monthly)
        // On passe le jour pour que App.tsx puisse calculer la semaine
      }
      onScheduledActivityCreate?.(newScheduled, day)
      setDraggedActivity(null)
      setHoveredSlot(null)
      return
    }

    // Vérifier si on drag une PlannedActivity existante
    if (draggedPlannedActivity) {
      const planned = draggedPlannedActivity
      
      // Si la plannedActivity a un scheduledActivityId, modifier la scheduledActivity source
      if (planned.scheduledActivityId) {
        const scheduled = scheduledActivities.find(s => s.id === planned.scheduledActivityId)
        if (scheduled) {
          // Préserver la durée de l'activité existante
          const start = timeToMinutes(scheduled.startTime)
          const end = timeToMinutes(scheduled.endTime)
          const duration = end - start
          let startMinutes = hour * 60 + minute
          let endMinutes = startMinutes + duration
          const maxMinutes = (END_HOUR + 1) * 60 // 23:00 = 1380 minutes
          const minMinutes = START_HOUR * 60 // 6:00 = 360 minutes
          
          // Ajuster si l'activité dépasse 23:00 : proposer le dernier créneau possible
          if (endMinutes > maxMinutes) {
            endMinutes = maxMinutes
            startMinutes = endMinutes - duration
          }
          
          // Ajuster si l'activité commence avant 6:00 : proposer le premier créneau possible
          if (startMinutes < minMinutes) {
            startMinutes = minMinutes
            endMinutes = startMinutes + duration
            // Si après ajustement, ça dépasse encore 23:00, limiter à 23:00
            if (endMinutes > maxMinutes) {
              endMinutes = maxMinutes
              startMinutes = endMinutes - duration
              // Si la durée est trop grande, ne pas permettre le drop
              if (startMinutes < minMinutes) {
                return
              }
            }
          }
          
          const startTime = minutesToTime(startMinutes)
          const endTime = minutesToTime(endMinutes)
          
          // Préserver toutes les propriétés de l'activité scheduled originale
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
      let startMinutes = hour * 60 + minute
      let endMinutes = startMinutes + duration
      const maxMinutes = (END_HOUR + 1) * 60 // 23:00 = 1380 minutes
      const minMinutes = START_HOUR * 60 // 6:00 = 360 minutes
      
      // Ajuster si l'activité dépasse 23:00 : proposer le dernier créneau possible
      if (endMinutes > maxMinutes) {
        endMinutes = maxMinutes
        startMinutes = endMinutes - duration
      }
      
      // Ajuster si l'activité commence avant 6:00 : proposer le premier créneau possible
      if (startMinutes < minMinutes) {
        startMinutes = minMinutes
        endMinutes = startMinutes + duration
        // Si après ajustement, ça dépasse encore 23:00, limiter à 23:00
        if (endMinutes > maxMinutes) {
          endMinutes = maxMinutes
          startMinutes = endMinutes - duration
          // Si la durée est trop grande, ne pas permettre le drop
          if (startMinutes < minMinutes) {
            return
          }
        }
      }
      
      const startTime = minutesToTime(startMinutes)
      const endTime = minutesToTime(endMinutes)
      
      // Préserver toutes les propriétés de l'activité planned originale
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
    if (draggedScheduledActivity) {
      const scheduled = draggedScheduledActivity
      // Préserver la durée de l'activité existante
      const start = timeToMinutes(scheduled.startTime)
      const end = timeToMinutes(scheduled.endTime)
      const duration = end - start
      let startMinutes = hour * 60 + minute
      let endMinutes = startMinutes + duration
      const maxMinutes = (END_HOUR + 1) * 60 // 23:00 = 1380 minutes
      const minMinutes = START_HOUR * 60 // 6:00 = 360 minutes
      
      // Ajuster si l'activité dépasse 23:00 : proposer le dernier créneau possible
      if (endMinutes > maxMinutes) {
        endMinutes = maxMinutes
        startMinutes = endMinutes - duration
      }
      
      // Ajuster si l'activité commence avant 6:00 : proposer le premier créneau possible
      if (startMinutes < minMinutes) {
        startMinutes = minMinutes
        endMinutes = startMinutes + duration
        // Si après ajustement, ça dépasse encore 23:00, limiter à 23:00
        if (endMinutes > maxMinutes) {
          endMinutes = maxMinutes
          startMinutes = endMinutes - duration
          // Si la durée est trop grande, ne pas permettre le drop
          if (startMinutes < minMinutes) {
            return
          }
        }
      }
      
      const startTime = minutesToTime(startMinutes)
      const endTime = minutesToTime(endMinutes)
      
      // Pour les activités quotidiennes (daily avec frequency < 7), on ne change pas le dayOfWeek
      // car elles s'affichent sur tous les jours
      // Préserver toutes les propriétés de l'activité scheduled originale
      const updated: ScheduledActivity = {
        ...scheduled,
        startTime,
        endTime,
        // Ne mettre à jour dayOfWeek que si ce n'est pas une activité quotidienne
        ...(scheduled.periodicity?.unit === 'daily' && scheduled.periodicity.frequency < 7 
          ? {} 
          : { dayOfWeek }),
      }
      onScheduledActivityUpdate?.(updated)
      setDraggedScheduledActivity(null)
      setHoveredSlot(null)
      return
    }

    // Fallback : essayer de récupérer depuis dataTransfer (pour compatibilité)
    const activityData = e.dataTransfer.getData('activity')
    if (activityData) {
      try {
        const activity: Activity = JSON.parse(activityData)
        let startMinutes = hour * 60 + minute
        let endMinutes = startMinutes + DEFAULT_ACTIVITY_DURATION
        const maxMinutes = (END_HOUR + 1) * 60 // 23:00 = 1380 minutes
        const minMinutes = START_HOUR * 60 // 6:00 = 360 minutes
        
        // Ajuster si l'activité dépasse 23:00 : proposer le dernier créneau possible
        if (endMinutes > maxMinutes) {
          endMinutes = maxMinutes
          startMinutes = endMinutes - DEFAULT_ACTIVITY_DURATION
        }
        
        // Ajuster si l'activité commence avant 6:00 : proposer le premier créneau possible
        if (startMinutes < minMinutes) {
          startMinutes = minMinutes
          endMinutes = startMinutes + DEFAULT_ACTIVITY_DURATION
          // Si après ajustement, ça dépasse encore 23:00, limiter à 23:00
          if (endMinutes > maxMinutes) {
            endMinutes = maxMinutes
            startMinutes = endMinutes - DEFAULT_ACTIVITY_DURATION
            // Si la durée est trop grande, ne pas permettre le drop
            if (startMinutes < minMinutes) {
              return
            }
          }
        }
        
        const startTime = minutesToTime(startMinutes)
        const endTime = minutesToTime(endMinutes)
        const newScheduled: ScheduledActivity = {
          activityId: activity.id!,
          startTime,
          endTime,
          dayOfWeek,
        }
        onScheduledActivityCreate?.(newScheduled, day)
        setDraggedActivity(null)
        setHoveredSlot(null)
        return
      } catch (error) {
        console.error('Erreur lors de la désérialisation de l\'activité:', error)
      }
    }

    const plannedData = e.dataTransfer.getData('plannedActivity')
    if (plannedData) {
      try {
        const planned: PlannedActivity = JSON.parse(plannedData)
        const dateStr = day.toISOString().split('T')[0]
        const start = timeToMinutes(planned.startTime)
        const end = timeToMinutes(planned.endTime)
        const duration = end - start
        let startMinutes = hour * 60 + minute
        let endMinutes = startMinutes + duration
        const maxMinutes = (END_HOUR + 1) * 60 // 23:00 = 1380 minutes
        const minMinutes = START_HOUR * 60 // 6:00 = 360 minutes
        
        // Ajuster si l'activité dépasse 23:00 : proposer le dernier créneau possible
        if (endMinutes > maxMinutes) {
          endMinutes = maxMinutes
          startMinutes = endMinutes - duration
        }
        
        // Ajuster si l'activité commence avant 6:00 : proposer le premier créneau possible
        if (startMinutes < minMinutes) {
          startMinutes = minMinutes
          endMinutes = startMinutes + duration
          // Si après ajustement, ça dépasse encore 23:00, limiter à 23:00
          if (endMinutes > maxMinutes) {
            endMinutes = maxMinutes
            startMinutes = endMinutes - duration
            // Si la durée est trop grande, ne pas permettre le drop
            if (startMinutes < minMinutes) {
              return
            }
          }
        }
        
        const startTime = minutesToTime(startMinutes)
        const endTime = minutesToTime(endMinutes)
        
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
      } catch (error) {
        console.error('Erreur lors de la désérialisation de la plannedActivity:', error)
      }
    }

    const scheduledData = e.dataTransfer.getData('scheduledActivity')
    if (scheduledData) {
      try {
        const scheduled: ScheduledActivity = JSON.parse(scheduledData)
        const start = timeToMinutes(scheduled.startTime)
        const end = timeToMinutes(scheduled.endTime)
        const duration = end - start
        let startMinutes = hour * 60 + minute
        let endMinutes = startMinutes + duration
        const maxMinutes = (END_HOUR + 1) * 60 // 23:00 = 1380 minutes
        const minMinutes = START_HOUR * 60 // 6:00 = 360 minutes
        
        // Ajuster si l'activité dépasse 23:00 : proposer le dernier créneau possible
        if (endMinutes > maxMinutes) {
          endMinutes = maxMinutes
          startMinutes = endMinutes - duration
        }
        
        // Ajuster si l'activité commence avant 6:00 : proposer le premier créneau possible
        if (startMinutes < minMinutes) {
          startMinutes = minMinutes
          endMinutes = startMinutes + duration
          // Si après ajustement, ça dépasse encore 23:00, limiter à 23:00
          if (endMinutes > maxMinutes) {
            endMinutes = maxMinutes
            startMinutes = endMinutes - duration
            // Si la durée est trop grande, ne pas permettre le drop
            if (startMinutes < minMinutes) {
              return
            }
          }
        }
        
        const startTime = minutesToTime(startMinutes)
        const endTime = minutesToTime(endMinutes)
        
        const updated: ScheduledActivity = {
          ...scheduled,
          startTime,
          endTime,
          ...(scheduled.periodicity?.unit === 'daily' && scheduled.periodicity.frequency < 7 
            ? {} 
            : { dayOfWeek }),
        }
        onScheduledActivityUpdate?.(updated)
        setDraggedScheduledActivity(null)
        setHoveredSlot(null)
        return
      } catch (error) {
        console.error('Erreur lors de la désérialisation de la scheduledActivity:', error)
      }
    }
  }

  // Gérer le drag over pour le hover avec throttling pour éviter les tremblements
  const handleDragOver = (e: React.DragEvent, day: Date, hour: number, minute: number) => {
    e.preventDefault()
    e.stopPropagation()
    // Utiliser requestAnimationFrame pour améliorer la fluidité
    requestAnimationFrame(() => {
      setHoveredSlot({ day, hour, minute })
    })
  }

  // Calculer le slot à partir des coordonnées de la souris
  const getSlotFromMousePosition = (e: React.DragEvent): { hour: number; minute: number } | null => {
    if (!plannerRef.current) return null
    
    const rect = plannerRef.current.getBoundingClientRect()
    // Le header sticky a une hauteur de 48px (h-12)
    // On soustrait la hauteur du header et on ajoute scrollTop pour obtenir la position absolue dans le contenu scrollé
    const HEADER_HEIGHT = 48 // h-12 = 48px
    const currentScrollTop = plannerRef.current.scrollTop
    const relativeY = e.clientY - rect.top - HEADER_HEIGHT + currentScrollTop
    
    if (relativeY < 0) return null
    
    const totalMinutes = (relativeY / SLOT_HEIGHT) * 60
    const hour = Math.floor(totalMinutes / 60) + START_HOUR
    const minute = Math.floor((totalMinutes % 60) / SLOT_MINUTES) * SLOT_MINUTES
    
    // Permettre jusqu'à 23:00 pour le drag (END_HOUR + 1)
    if (hour < START_HOUR || hour > END_HOUR + 1) return null
    // Limiter à 23:00 maximum
    if (hour === END_HOUR + 1 && minute > 0) return null
    
    return { hour, minute }
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
    
    // Utiliser requestAnimationFrame pour améliorer la fluidité
    requestAnimationFrame(() => {
      const slot = getSlotFromMousePosition(e)
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

    // Ajuster la position en soustrayant les heures avant START_HOUR
    const startMinutesFromStart = start - (START_HOUR * 60)
    const top = (startMinutesFromStart / 60) * SLOT_HEIGHT
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
    let previewStartMinutes = hoveredSlot.hour * 60 + hoveredSlot.minute
    let previewEndMinutes = previewStartMinutes + duration
    
    // Ajuster si l'activité dépasse 23:00 : proposer le dernier créneau possible
    const maxMinutes = (END_HOUR + 1) * 60 // 23:00 = 1380 minutes
    if (previewEndMinutes > maxMinutes) {
      // Ajuster pour que l'activité se termine à 23:00
      previewEndMinutes = maxMinutes
      previewStartMinutes = previewEndMinutes - duration
    }
    
    // Ajuster si l'activité commence avant 6:00 : proposer le premier créneau possible
    const minMinutes = START_HOUR * 60 // 6:00 = 360 minutes
    if (previewStartMinutes < minMinutes) {
      // Ajuster pour que l'activité commence à 6:00
      previewStartMinutes = minMinutes
      previewEndMinutes = previewStartMinutes + duration
      // Si après ajustement, ça dépasse encore 23:00, limiter à 23:00
      if (previewEndMinutes > maxMinutes) {
        previewEndMinutes = maxMinutes
        previewStartMinutes = previewEndMinutes - duration
        // Si la durée est trop grande, ne pas afficher
        if (previewStartMinutes < minMinutes) {
          return null
        }
      }
    }
    
    const previewStartMinutesFromStart = previewStartMinutes - (START_HOUR * 60)
    const top = (previewStartMinutesFromStart / 60) * SLOT_HEIGHT
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
    
    // Scroll automatique si la souris est proche des bords
    const SCROLL_THRESHOLD = 50 // Distance en pixels du bord pour déclencher le scroll
    const SCROLL_SPEED = 5 // Vitesse de scroll en pixels par frame
    const mouseYRelativeToViewport = e.clientY - rect.top 
    
    // Scroll vers le haut si la souris est proche du bord supérieur
    if (mouseYRelativeToViewport < SCROLL_THRESHOLD && plannerRef.current.scrollTop > 0) {
      const newScrollTop = Math.max(0, plannerRef.current.scrollTop - SCROLL_SPEED)
      plannerRef.current.scrollTop = newScrollTop
    }
    // Scroll vers le bas si la souris est proche du bord inférieur
    else if (mouseYRelativeToViewport > rect.height - SCROLL_THRESHOLD) {
      const maxScroll = plannerRef.current.scrollHeight - plannerRef.current.clientHeight
      if (plannerRef.current.scrollTop < maxScroll) {
        const newScrollTop = Math.min(maxScroll, plannerRef.current.scrollTop + SCROLL_SPEED)
        plannerRef.current.scrollTop = newScrollTop
      }
    }
    
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
    const maxMinutes = (END_HOUR + 1) * 60 // 23:00 = 1380 minutes
    
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
          const start = timeToMinutes(updatedPlanned.startTime)
          const end = timeToMinutes(updatedPlanned.endTime)
          if (end > start && end - start >= 15 && end <= maxMinutes) { // Minimum 15 minutes et max 23:00
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
      const start = timeToMinutes(updated.startTime)
      const end = timeToMinutes(updated.endTime)
      if (end > start && end - start >= 15 && end <= maxMinutes) { // Minimum 15 minutes et max 23:00
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
      const start = timeToMinutes(updated.startTime)
      const end = timeToMinutes(updated.endTime)
      if (end > start && end - start >= 15 && end <= maxMinutes) { // Minimum 15 minutes et max 23:00
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

  return (
    <div className="flex flex-col h-full overflow-hidden pb-6">
      {/* Sélecteur d'activité - uniquement en mode routine */}
      {mode === 'routine' && (
        <div className="p-4 border-b bg-gray-50 flex-shrink-0">
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
      <div className="flex-1 flex flex-col bg-white min-h-0">
        {/* Zone scrollable avec les heures et les slots */}
        <div className="flex-1 overflow-auto" ref={plannerRef} style={{ minHeight: 0 }}>
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
                    className={`flex items-center justify-center transition-all rounded ${
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
                    className={`flex items-center justify-center transition-all rounded ${
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
                      ? 'linear-gradient(to bottom, rgba(213, 196, 168, 1), rgba(213, 196, 168, 0.25))'
                      : 'linear-gradient(to bottom, rgba(234, 221, 205, 1), rgba(234, 221, 205, 0.25))'
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
                  className="border-b"
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
                          className="border-b border-r"
                          style={{
                            height: `${SLOT_HEIGHT / (60 / SLOT_MINUTES)}px`,
                            position: 'relative',
                          }}
                          onDrop={(e) => handleDrop(e, day, slot.hour, slot.minute)}
                          onDragOver={(e) => handleDragOver(e, day, slot.hour, slot.minute)}
                          onDragLeave={handleDragLeave}
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

                      const isSelected = selectedPlannedActivity?.id === planned.id
                      const isCurrentlyResizing = isResizing && isSelected

                      return (
                        <div
                          key={planned.id}
                          draggable={!isCurrentlyResizing}
                          onDragStart={(e) => {
                            if (isCurrentlyResizing) {
                              e.preventDefault()
                              return
                            }
                            handlePlannedActivityDragStart(e, planned)
                          }}
                          onDragEnd={() => {
                            setDraggedPlannedActivity(null)
                            setHoveredSlot(null)
                          }}
                          onDragOver={(e) => handleActivityDragOver(e, day, planned.id)}
                          onDrop={(e) => handleActivityDrop(e, day, planned.id)}
                          style={{
                            ...style,
                            cursor: isCurrentlyResizing ? 'ns-resize' : 'move',
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
                          {/* Poignée de redimensionnement en haut */}
                          {isSelected && activity && (
                            <div
                              className="absolute left-1/2 transform -translate-x-1/2 cursor-ns-resize z-20"
                              onMouseDown={(e) => handleResizeStart(e, planned, 'top')}
                              style={{
                                top: '-3px',
                                width: '40px',
                                height: '6px',
                                backgroundColor: getTextColor(getColorHex(activity.color)),
                                borderRadius: '3px',
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
                              className="absolute left-1/2 transform -translate-x-1/2 cursor-ns-resize z-20"
                              onMouseDown={(e) => handleResizeStart(e, planned, 'bottom')}
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

                  {/* Afficher les activités planifiées (scheduled) - uniquement en mode routine */}
                  {mode === 'routine' && (() => {
                    // En mode routine, on affiche les scheduledActivities basées sur dayOfWeek
                    // Mais pour les activités quotidiennes (daily avec frequency < 7), on les affiche sur tous les jours
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
                      // Ajuster la position en soustrayant les heures avant START_HOUR
                      const startMinutesFromStart = start - (START_HOUR * 60)
                      const top = (startMinutesFromStart / 60) * SLOT_HEIGHT
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
                          
                          {/* Bouton de suppression */}
                          {isSelected && activity && onScheduledActivityDelete && scheduled.id !== undefined && (
                            <button
                              className="absolute top-1 right-1 z-30 rounded-full w-5 h-5 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${activity.title}" de la routine ?`)) {
                                  onScheduledActivityDelete(scheduled.id!)
                                  setSelectedScheduledActivity(null)
                                }
                              }}
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.9)',
                                color: '#FFFFFF',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                              }}
                              title="Supprimer de la routine"
                            >
                              ×
                            </button>
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
