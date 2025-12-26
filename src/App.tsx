import { useState, useEffect, useRef } from 'react'
import { Activity, Color } from './models/Activity'
import { ScheduledActivity, PlannedActivity, User } from './models/Planning'
import ActivityModal from './components/ActivityModal'
import Planner from './components/Planner'
import Admin from './components/Admin'
import SearchActivitiesPanel from './components/SearchActivitiesPanel'
import { ActivityDelete } from './utils/ActivityDelete'
import { logApiRequest } from './utils/ApiLogger'
import { generatePlannedActivities } from './utils/PlannedActivityGenerator'
import { makeColorHappier } from './utils/ColorUtils'
import { 
  getSavedUsers, 
  saveUserToFile, 
  loadUserFromFile, 
  deleteSavedUser,
  type SavedUser 
} from './utils/UserSaveUtils'
import { useAppSettings } from './contexts/AppSettingsContext'
import { getBorderRadiusFromSettings } from './utils/BorderRadiusUtils'

interface ActivitiesData {
  activities: Activity[]
}

type ViewMode = 'activities' | 'planner' | 'admin'

function App() {
  const { settings } = useAppSettings()
  const [borderRadiusClass, setBorderRadiusClass] = useState<string>('rounded-xl')
  
  useEffect(() => {
    const newBorderRadius = getBorderRadiusFromSettings(settings)
    setBorderRadiusClass(newBorderRadius)
  }, [settings.design?.borderRadius])
  
  const [viewMode, setViewMode] = useState<ViewMode>('planner')
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [user, setUser] = useState<User>({
    id: 1,
    activities: [],
    templates: [],
    calendars: [{ id: 1, name: 'Calendrier principal', plannedActivities: [] }],
  })
  const [loading, setLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [selectedScheduledActivity, setSelectedScheduledActivity] = useState<ScheduledActivity | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date())
  const [currentCalendarId] = useState<number>(1)
  const [plannerMode, setPlannerMode] = useState<'routine' | 'calendrier'>('routine')
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null)


  // Charger le user depuis localStorage au démarrage
  useEffect(() => {
    const userId = 1
    const storedUser = localStorage.getItem(`user_${userId}`)
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User
        setUser(parsedUser)
        setLoading(false)
        return
      } catch (error) {
        console.error('Erreur lors du parsing du user depuis localStorage:', error)
      }
    }

    // Si pas de user en localStorage, charger depuis le JSON
    fetch('/activity-example.json')
      .then(response => response.json())
      .then((data: ActivitiesData) => {
        // Mélanger les activités pour un effet random
        const shuffled = [...data.activities].sort(() => Math.random() - 0.5)
        setUser(prev => ({
          ...prev,
          activities: shuffled,
        }))
        setLoading(false)
      })
      .catch(error => {
        console.error('Erreur lors du chargement des activités:', error)
        setLoading(false)
      })
  }, [])

  // Mettre à jour toutes les couleurs personnalisées (hex) pour les rendre 10% plus joyeuses
  // Utiliser un ref pour s'assurer que cela ne s'exécute qu'une seule fois
  const colorsUpdatedRef = useRef(false)
  useEffect(() => {
    if (user.id && !loading && user.activities.length > 0 && !colorsUpdatedRef.current) {
      const hasCustomColors = user.activities.some(
        activity => typeof activity.color === 'string' && activity.color.startsWith('#')
      )
      
      if (hasCustomColors) {
        colorsUpdatedRef.current = true
        setUser(prev => ({
          ...prev,
          activities: prev.activities.map(activity => {
            // Si c'est une couleur personnalisée (hex), la rendre plus joyeuse
            if (typeof activity.color === 'string' && activity.color.startsWith('#')) {
              return {
                ...activity,
                color: makeColorHappier(activity.color)
              }
            }
            return activity
          })
        }))
      }
    }
  }, [user.id, loading, user.activities.length])

  // Sauvegarder le user dans localStorage à chaque modification
  useEffect(() => {
    if (user.id && !loading) {
      localStorage.setItem(`user_${user.id}`, JSON.stringify(user))
    }
  }, [user, loading])

  const handleDelete = (id: number | undefined) => {
    if (id !== undefined) {
      setUser(prev => ({
        ...prev,
        activities: ActivityDelete.deleteActivity(prev.activities, id),
      }))
    }
  }

  const handleResetUser = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser complètement le user ? Toutes les activités, templates et calendriers seront supprimés.')) {
      // Créer l'activité "Reflexion"
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      
      // Trouver le créneau le plus proche selon slotMinutes
      const slotMinutes = settings.planner.slotMinutes
      const startHour = settings.planner.startHour
      const endHour = settings.planner.endHour
      
      // Arrondir les minutes au créneau le plus proche
      const roundedMinute = Math.round(currentMinute / slotMinutes) * slotMinutes
      let nearestHour = currentHour
      let nearestMinute = roundedMinute
      
      // Gérer le débordement des minutes (ex: 14:50 avec slotMinutes=15 -> 15:00)
      if (nearestMinute >= 60) {
        nearestHour += 1
        nearestMinute = 0
      }
      
      // S'assurer que le créneau est dans les limites du planner
      if (nearestHour < startHour) {
        nearestHour = startHour
        nearestMinute = 0
      } else if (nearestHour > endHour) {
        nearestHour = endHour
        nearestMinute = 0
      }
      
      // Calculer l'heure de fin (30 minutes plus tard)
      // Comme 30 minutes est toujours un multiple de slotMinutes (5, 10, 15, 30, 60),
      // l'heure de fin sera automatiquement sur un créneau valide
      const endMinutes = nearestMinute + 30
      let endHourCalc = nearestHour
      let endMinuteCalc = endMinutes
      
      // Gérer le débordement des minutes
      if (endMinuteCalc >= 60) {
        endHourCalc += 1
        endMinuteCalc -= 60
      }
      
      // S'assurer que l'heure de fin ne dépasse pas endHour
      if (endHourCalc > endHour) {
        // Si on dépasse, ajuster pour que l'activité se termine à endHour:00
        endHourCalc = endHour
        endMinuteCalc = 0
        // Ajuster l'heure de début pour garder 30 minutes de durée
        const totalStartMinutes = endHourCalc * 60 - 30
        nearestHour = Math.floor(totalStartMinutes / 60)
        nearestMinute = totalStartMinutes % 60
        // Réarrondir nearestMinute au créneau le plus proche
        nearestMinute = Math.floor(nearestMinute / slotMinutes) * slotMinutes
        // S'assurer que nearestHour est dans les limites
        if (nearestHour < startHour) {
          nearestHour = startHour
          nearestMinute = 0
        }
      }
      
      const endTime = `${String(endHourCalc).padStart(2, '0')}:${String(endMinuteCalc).padStart(2, '0')}`
      // Recalculer startTime avec les valeurs finales (peut avoir été ajusté)
      const startTime = `${String(nearestHour).padStart(2, '0')}:${String(nearestMinute).padStart(2, '0')}`
      
      // Créer l'activité Reflexion
      const reflexionActivity: Activity = {
        id: 1,
        title: 'Reflexion',
        description: '',
        color: Color.BURNT_ORANGE,
        textColor: 'black',
        recurringActivities: [],
      }
      
      // Créer la ScheduledActivity hebdomadaire
      const reflexionScheduled: ScheduledActivity = {
        id: 1,
        activityId: 1,
        startTime: startTime,
        endTime: endTime,
        dayOfWeek: now.getDay(), // Jour actuel (0 = dimanche, 6 = samedi)
        periodicity: {
          frequency: 1,
          unit: 'weekly',
        },
      }
      
      // Générer les PlannedActivities pour les 90 prochains jours
      const startDate = new Date()
      const endDatePlanned = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      const generatedPlanned = generatePlannedActivities([reflexionScheduled], startDate, endDatePlanned)
      
      // Assigner des IDs aux PlannedActivities
      const plannedWithIds = generatedPlanned.map((planned, index) => ({
        ...planned,
        id: index + 1,
      }))
      
      const newUser: User = {
        id: 1,
        activities: [reflexionActivity],
        templates: [{ id: 1, userId: 1, scheduledActivities: [reflexionScheduled] }],
        calendars: [{ id: 1, name: 'Calendrier principal', plannedActivities: plannedWithIds }],
      }
      setUser(newUser)
      // Supprimer aussi le localStorage pour forcer le rechargement
      localStorage.removeItem('user_1')
      localStorage.setItem('user_1', JSON.stringify(newUser))
      alert('User réinitialisé avec succès !')
    }
  }

  // Fonction pour sauvegarder le user
  const handleSaveUser = async () => {
    const result = await saveUserToFile(user)
    if (result.success) {
      alert(result.message)
    } else if (result.message !== 'Sauvegarde annulée') {
      alert(`Erreur: ${result.message}`)
    }
  }

  // Fonction pour charger un user depuis un fichier
  const handleLoadUserFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    loadUserFromFile(
      file,
      (loadedUser) => {
        setUser(loadedUser)
        localStorage.setItem('user_1', JSON.stringify(loadedUser))
        alert('User chargé avec succès !')
      },
      (error) => {
        alert('Erreur lors du chargement du fichier. Vérifiez que c\'est un fichier JSON valide.')
        console.error('Erreur lors du chargement:', error)
      }
    )
    
    // Réinitialiser l'input pour permettre de recharger le même fichier
    event.target.value = ''
  }

  // Fonction pour charger un user depuis la liste des sauvegardes
  const handleLoadUserFromSave = (savedUser: SavedUser) => {
    if (window.confirm(`Charger la sauvegarde ${savedUser.filename} ? Cela remplacera le user actuel.`)) {
      setUser(savedUser.data)
      localStorage.setItem('user_1', JSON.stringify(savedUser.data))
      alert('User chargé avec succès !')
    }
  }

  // Fonction pour supprimer une sauvegarde de la liste
  const handleDeleteSave = (filename: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (window.confirm(`Supprimer la sauvegarde ${filename} de la liste ?`)) {
      deleteSavedUser(filename)
      alert('Sauvegarde supprimée de la liste')
    }
  }

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity)
    setIsModalOpen(true)
  }

  const handleCreateActivity = () => {
    setSelectedActivity(null)
    setIsModalOpen(true)
    setPlannerMode('routine')
  }

  const handleSaveActivity = (activity: Activity) => {
    if (activity.id) {
      // Modifier une activité existante
      setUser(prev => ({
        ...prev,
        activities: prev.activities.map(a => a.id === activity.id ? activity : a),
      }))
    } else {
      // Créer une nouvelle activité
      const newId = Math.max(...user.activities.map(a => a.id || 0), 0) + 1
      activity.id = newId
      setUser(prev => ({
        ...prev,
        activities: [...prev.activities, { ...activity, id: newId }],
      }))
    }
  }

  // Fonction pour générer les plannedActivities basées sur les scheduledActivities
  // Retourne les plannedActivities générées (sans doublons)
  const generatePlannedActivitiesForScheduled = (
    scheduledActivities: ScheduledActivity[],
    currentUserState: User
  ): PlannedActivity[] => {
    const startDate = new Date()
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 jours
    
    const generatedPlanned = generatePlannedActivities(scheduledActivities, startDate, endDate)
    
    // Assigner des IDs uniques aux nouvelles plannedActivities
    const currentCalendar = currentUserState.calendars.find(c => c.id === currentCalendarId)
    if (!currentCalendar) return generatedPlanned
    
    const existingIds = currentCalendar.plannedActivities.map(p => p.id || 0)
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0
    
    const plannedWithIds = generatedPlanned.map((planned, index) => ({
      ...planned,
      id: maxId + index + 1,
    }))
    
    // Filtrer les plannedActivities qui existent déjà (même date, même scheduledActivityId, même startTime)
    const existingPlanned = currentCalendar.plannedActivities
    const newPlanned = plannedWithIds.filter(newPlanned => {
      return !existingPlanned.some(existing => 
        existing.date === newPlanned.date &&
        existing.scheduledActivityId === newPlanned.scheduledActivityId &&
        existing.startTime === newPlanned.startTime
      )
    })
    
    return newPlanned
  }

  const handleDeleteActivity = (id: number | undefined) => {
    handleDelete(id)
  }

  const handleActivityClickInModal = (activityId: number) => {
    const clickedActivity = user.activities.find(a => a.id === activityId)
    if (clickedActivity) {
      setSelectedActivity(clickedActivity)
      // Le modal reste ouvert, mais avec la nouvelle activité
    }
  }

  // Fonction de log centralisée qui construit et affiche le payload API
  const logPlannerUpdate = (operation: string, params: any) => {
    switch (operation) {
      case 'onScheduledActivityCreate': {
        const scheduled = params.scheduled as ScheduledActivity
        const generatedPlanned = params.generatedPlannedActivities as PlannedActivity[] || []
        const template = user.templates.find(t => t.id === 1)
        
        if (template) {
          // PATCH pour mettre à jour un template existant
          logApiRequest({
            method: 'PATCH',
            path: '/api/users/:userId/templates/:templateId',
            pathParams: { userId: user.id!, templateId: template.id! },
            body: {
              scheduledActivities: [
                ...template.scheduledActivities,
                scheduled
              ]
            }
          })
          
          // Simuler le retour serveur avec les plannedActivities générées
          setTimeout(() => {
            logApiRequest({
              method: 'GET',
              path: '/api/users/:userId/calendars/:calendarId/planned-activities',
              pathParams: { userId: user.id!, calendarId: currentCalendarId },
              response: {
                plannedActivities: generatedPlanned
              }
            })
          }, 100)
        } else {
          // POST pour créer un nouveau template
          logApiRequest({
            method: 'POST',
            path: '/api/users/:userId/templates',
            pathParams: { userId: user.id! },
            body: {
              userId: user.id,
              scheduledActivities: [scheduled]
            }
          })
          
          // Simuler le retour serveur avec les plannedActivities générées
          setTimeout(() => {
            logApiRequest({
              method: 'GET',
              path: '/api/users/:userId/calendars/:calendarId/planned-activities',
              pathParams: { userId: user.id!, calendarId: currentCalendarId },
              response: {
                plannedActivities: generatedPlanned
              }
            })
          }, 100)
        }
        break
      }
      
      case 'onScheduledActivityDelete': {
        const scheduledActivityId = params.scheduledActivityId as number
        const templateId = params.templateId as number
        const template = user.templates.find(t => t.id === templateId)
        const scheduled = template?.scheduledActivities.find(s => s.id === scheduledActivityId)

        if (template && scheduled && scheduledActivityId) {
          logApiRequest({
            method: 'DELETE',
            path: '/api/users/:userId/templates/:templateId/scheduled-activities/:scheduledActivityId',
            pathParams: {
              userId: user.id!,
              templateId: template.id!,
              scheduledActivityId: scheduledActivityId
            }
          })

          // Simuler le retour serveur
          setTimeout(() => {
            logApiRequest({
              method: 'DELETE',
              path: '/api/users/:userId/templates/:templateId/scheduled-activities/:scheduledActivityId',
              pathParams: {
                userId: user.id!,
                templateId: template.id!,
                scheduledActivityId: scheduledActivityId
              },
              response: {
                success: true,
                message: 'Scheduled activity deleted successfully'
              }
            })
          }, 100)
        }
        break
      }

      case 'onScheduledActivityUpdate': {
        const scheduled = params.scheduled as ScheduledActivity
        const generatedPlanned = params.generatedPlannedActivities as PlannedActivity[] || []
        const template = user.templates.find(t => 
          t.scheduledActivities.some(s => s.id === scheduled.id)
        )
        
        if (template && scheduled.id) {
          logApiRequest({
            method: 'PATCH',
            path: '/api/users/:userId/templates/:templateId/scheduled-activities/:scheduledActivityId',
            pathParams: { 
              userId: user.id!, 
              templateId: template.id!,
              scheduledActivityId: scheduled.id
            },
            body: {
              activityId: scheduled.activityId,
              startTime: scheduled.startTime,
              endTime: scheduled.endTime,
              dayOfWeek: scheduled.dayOfWeek,
              periodicity: scheduled.periodicity
            }
          })
          
          // Simuler le retour serveur avec les plannedActivities générées
          setTimeout(() => {
            logApiRequest({
              method: 'GET',
              path: '/api/users/:userId/calendars/:calendarId/planned-activities',
              pathParams: { userId: user.id!, calendarId: currentCalendarId },
              response: {
                plannedActivities: generatedPlanned
              }
            })
          }, 100)
        }
        break
      }
      
      case 'onPlannedActivityUpdate': {
        const planned = params.planned as PlannedActivity
        const calendar = user.calendars.find(c => 
          c.plannedActivities.some(p => p.id === planned.id)
        )
        
        if (calendar && planned.id) {
          logApiRequest({
            method: 'PATCH',
            path: '/api/users/:userId/calendars/:calendarId/planned-activities/:plannedActivityId',
            pathParams: { 
              userId: user.id!, 
              calendarId: calendar.id!,
              plannedActivityId: planned.id
            },
            body: {
              activityId: planned.activityId,
              date: planned.date,
              startTime: planned.startTime,
              endTime: planned.endTime,
              scheduledActivityId: planned.scheduledActivityId
            }
          })
        }
        break
      }
      
      case 'onPlannedActivityCreate': {
        const planned = params.planned as PlannedActivity
        
        logApiRequest({
          method: 'POST',
          path: '/api/users/:userId/calendars/:calendarId/planned-activities',
          pathParams: { 
            userId: user.id!, 
            calendarId: currentCalendarId
          },
          body: {
            activityId: planned.activityId,
            date: planned.date,
            startTime: planned.startTime,
            endTime: planned.endTime,
            scheduledActivityId: planned.scheduledActivityId
          }
        })
        break
      }
      
      case 'onWeekChange': {
        logApiRequest({
          method: 'GET',
          path: '/api/users/:userId/calendars/:calendarId/planned-activities',
          pathParams: { userId: user.id!, calendarId: currentCalendarId },
          queryParams: {
            weekStart: params.weekStart.toISOString().split('T')[0]
          }
        })
        break
      }
      
      default:
        console.log('=== PLANNER UPDATE ===')
        console.log('Opération:', operation)
        console.log('Paramètres:', params)
        console.log('=====================')
    }
  }

  // Fonction pour calculer la semaine du mois (1-4 ou -1 pour dernière)
  const calculateWeekOfMonth = (date: Date): number => {
    const dayOfMonth = date.getDate()
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    
    // Calculer dans quelle semaine du mois on se trouve
    // Semaine 1: jours 1-7, Semaine 2: jours 8-14, Semaine 3: jours 15-21, Semaine 4: jours 22-28
    // Dernière semaine: les 7 derniers jours du mois
    
    // Vérifier si on est dans la dernière semaine (les 7 derniers jours)
    const lastWeekStart = lastDayOfMonth - 6
    if (dayOfMonth >= lastWeekStart) {
      // C'est la dernière semaine
      return -1
    }
    
    // Sinon, calculer la semaine normale (1-4)
    const week = Math.ceil(dayOfMonth / 7)
    return Math.min(week, 4) // Maximum 4
  }

  // Handlers pour le Planner
  const handleScheduledActivityCreate = (scheduled: ScheduledActivity, day?: Date) => {
    // Générer un nouvel ID pour la ScheduledActivity
    const allScheduledIds = user.templates.flatMap(t => t.scheduledActivities.map(s => s.id || 0))
    const newId = allScheduledIds.length > 0 ? Math.max(...allScheduledIds) + 1 : 1
    
    // Calculer la semaine du mois si la périodicité est monthly
    let periodicity = scheduled.periodicity || { frequency: 1, unit: 'weekly' }
    if (periodicity.unit === 'monthly' && scheduled.dayOfWeek !== undefined) {
      // Utiliser le jour où l'utilisateur a inséré l'activité pour calculer la semaine du mois
      // Si day n'est pas fourni (mode routine), utiliser la date actuelle
      const dateToUse = day || new Date()
      const weekOfMonth = calculateWeekOfMonth(dateToUse)
      periodicity = { ...periodicity, weekOfMonth }
    }
    
    const newScheduled: ScheduledActivity = { 
      ...scheduled, 
      id: newId,
      periodicity
    }
    
    setUser(prev => {
      // Trouver ou créer le template principal (id: 1)
      const templateId = 1
      const existingTemplate = prev.templates.find(t => t.id === templateId)
      
      let updatedTemplates
      if (existingTemplate) {
        // Mettre à jour le template existant
        const updatedTemplate = {
          ...existingTemplate,
          scheduledActivities: [...existingTemplate.scheduledActivities, newScheduled],
        }
        updatedTemplates = prev.templates.map(t => t.id === templateId ? updatedTemplate : t)
      } else {
        // Créer un nouveau template
        const newTemplate = {
          id: templateId,
          userId: prev.id!,
          scheduledActivities: [newScheduled],
        }
        updatedTemplates = [...prev.templates, newTemplate]
      }
      
      const updatedUser = {
        ...prev,
        templates: updatedTemplates,
      }
      
      // Simuler l'appel serveur : générer les plannedActivities
      const allScheduled = updatedTemplates.flatMap(t => t.scheduledActivities)
      const generatedPlanned = generatePlannedActivitiesForScheduled(allScheduled, updatedUser)
      
      // Ajouter les plannedActivities générées au calendrier
      const currentCalendar = updatedUser.calendars.find(c => c.id === currentCalendarId)
      if (currentCalendar && generatedPlanned.length > 0) {
        updatedUser.calendars = updatedUser.calendars.map(cal =>
          cal.id === currentCalendarId
            ? { ...cal, plannedActivities: [...cal.plannedActivities, ...generatedPlanned] }
            : cal
        )
      }
      
      // Log de l'appel API simulé avec les plannedActivities générées
      setTimeout(() => {
        logPlannerUpdate('onScheduledActivityCreate', { 
          scheduled: newScheduled,
          generatedPlannedActivities: generatedPlanned 
        })
      }, 0)
      
      return updatedUser
    })
  }

  const handleScheduledActivityDelete = (scheduledActivityId: number) => {
    setUser(prev => {
      // Trouver le template qui contient cette scheduledActivity
      const template = prev.templates.find(t =>
        t.scheduledActivities.some(s => s.id === scheduledActivityId)
      )
      
      if (!template) return prev
      
      // Supprimer la scheduledActivity du template
      const updatedTemplates = prev.templates.map(t => {
        if (t.id === template.id) {
          return {
            ...t,
            scheduledActivities: t.scheduledActivities.filter(s => s.id !== scheduledActivityId),
          }
        }
        return t
      })
      
      // Supprimer les plannedActivities associées à cette scheduledActivity
      const updatedUser = {
        ...prev,
        templates: updatedTemplates,
        calendars: prev.calendars.map(cal => ({
          ...cal,
          plannedActivities: cal.plannedActivities.filter(
            p => p.scheduledActivityId !== scheduledActivityId
          ),
        })),
      }
      
      // Log de l'appel API simulé
      setTimeout(() => {
        logPlannerUpdate('onScheduledActivityDelete', { 
          scheduledActivityId,
          templateId: template.id,
        })
      }, 0)
      
      return updatedUser
    })
  }

  const handleScheduledActivityUpdate = (scheduled: ScheduledActivity) => {
    setUser(prev => {
      const updatedTemplates = prev.templates.map(template => ({
        ...template,
        scheduledActivities: template.scheduledActivities.map(s => 
          s.id === scheduled.id ? scheduled : s
        ),
      }))
      
      const updatedUser = {
        ...prev,
        templates: updatedTemplates,
      }
      
      // Simuler l'appel serveur : régénérer toutes les plannedActivities pour cette scheduledActivity
      // Supprimer les anciennes plannedActivities liées à cette scheduledActivity
      const currentCalendar = updatedUser.calendars.find(c => c.id === currentCalendarId)
      if (currentCalendar) {
        const filteredPlanned = currentCalendar.plannedActivities.filter(
          p => p.scheduledActivityId !== scheduled.id
        )
        
        // Générer les nouvelles plannedActivities
        const generatedPlanned = generatePlannedActivities(
          [scheduled],
          new Date(),
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        )
        
        // Assigner des IDs
        const existingIds = filteredPlanned.map(p => p.id || 0)
        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0
        const plannedWithIds = generatedPlanned.map((planned, index) => ({
          ...planned,
          id: maxId + index + 1,
        }))
        
        updatedUser.calendars = updatedUser.calendars.map(cal =>
          cal.id === currentCalendarId
            ? { ...cal, plannedActivities: [...filteredPlanned, ...plannedWithIds] }
            : cal
        )
      }
      
      // Log de l'appel API simulé avec les plannedActivities générées
      logPlannerUpdate('onScheduledActivityUpdate', { 
        scheduled,
        generatedPlannedActivities: updatedUser.calendars.find(c => c.id === currentCalendarId)?.plannedActivities.filter(
          p => p.scheduledActivityId === scheduled.id
        ) || []
      })
      
      return updatedUser
    })
  }

  const handlePlannedActivityUpdate = (planned: PlannedActivity) => {
    setUser(prev => ({
      ...prev,
      calendars: prev.calendars.map(cal => ({
        ...cal,
        plannedActivities: cal.plannedActivities.map(p => 
          p.id === planned.id ? planned : p
        ),
      })),
    }))
    
    logPlannerUpdate('onPlannedActivityUpdate', { planned })
  }

  const handlePlannedActivityCreate = (planned: PlannedActivity) => {
    setUser(prev => {
      const currentCalendar = prev.calendars.find(c => c.id === currentCalendarId)
      if (!currentCalendar) return prev

      // Générer un nouvel ID pour la PlannedActivity
      const existingIds = currentCalendar.plannedActivities.map(p => p.id || 0)
      const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1

      const newPlanned: PlannedActivity = {
        ...planned,
        id: newId,
      }

      return {
        ...prev,
        calendars: prev.calendars.map(cal =>
          cal.id === currentCalendarId
            ? { ...cal, plannedActivities: [...cal.plannedActivities, newPlanned] }
            : cal
        ),
      }
    })

    logPlannerUpdate('onPlannedActivityCreate', { planned })
  }

  const handleWeekChange = (weekStart: Date) => {
    setCurrentWeek(weekStart)
    logPlannerUpdate('onWeekChange', { weekStart })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ece3d0' }}>
        <p className="text-gray-600">Chargement des activités...</p>
      </div>
    )
  }

  return (
    <div className="h-screen select-none flex flex-col overflow-hidden" style={{ backgroundColor: '#ece3d0' }}>
      <header className="w-full px-4 py-1 flex-shrink-0 relative" style={{ backgroundColor: '#ece3d0' }}>
        <div className="flex items-center justify-between">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-20 w-auto"
            onError={() => {
              // Fallback si l'image n'existe pas encore
              console.warn('Logo image not found at /logo.png')
            }}
          />
          
          {/* Navigation */}
          <nav className="flex gap-2 items-center">
            {/* Icône profil avec menu déroulant */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={`p-2 ${borderRadiusClass} h-12 transition-colors border border-black bg-white text-black hover:bg-gray-100`}
                aria-label="Menu profil"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Menu déroulant */}
              {isProfileMenuOpen && (
                <>
                  {/* Overlay pour fermer le menu en cliquant à l'extérieur */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  {/* Menu */}
                  <div
                    className={`absolute right-0 mt-2 w-48 ${borderRadiusClass} border border-black bg-white shadow-lg z-20`}
                  >
                    <button
                      onClick={() => {
                        setViewMode('admin')
                        setIsProfileMenuOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                        viewMode === 'admin' ? 'bg-gray-100 font-semibold' : ''
                      } ${borderRadiusClass}`}
                    >
                      Admin
                    </button>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {viewMode === 'admin' ? (
        <Admin 
          onResetUser={handleResetUser}
          onSaveUser={handleSaveUser}
          onLoadUserFromFile={handleLoadUserFromFile}
          savedUsers={getSavedUsers()}
          onLoadUserFromSave={handleLoadUserFromSave}
          onDeleteSave={handleDeleteSave}
        />
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden flex relative">
          {/* Planner - prend toute la page */}
          <div className={`flex-1 min-h-0 overflow-hidden transition-all duration-300 ${isSearchPanelOpen ? 'mr-80' : 'mr-12'}`}>
            <div className={`h-full m-4 ${borderRadiusClass} border border-black bg-white shadow-lg overflow-hidden`}>
              <Planner
                activities={user.activities}
                scheduledActivities={user.templates.flatMap(t => t.scheduledActivities)}
                plannedActivities={user.calendars.find(c => c.id === currentCalendarId)?.plannedActivities || []}
                onScheduledActivityCreate={handleScheduledActivityCreate}
                onScheduledActivityUpdate={handleScheduledActivityUpdate}
                onScheduledActivityDelete={handleScheduledActivityDelete}
                onPlannedActivityUpdate={handlePlannedActivityUpdate}
                onPlannedActivityCreate={handlePlannedActivityCreate}
                currentWeek={currentWeek}
                onWeekChange={handleWeekChange}
                draggedActivity={draggedActivity}
                onDragEnd={() => setDraggedActivity(null)}
                onModeChange={(mode) => setPlannerMode(mode)}
                onActivityDoubleClick={(activityId, scheduledActivityId, mode) => {
                  const activity = user.activities.find(a => a.id === activityId)
                  if (activity) {
                    setSelectedActivity(activity)
                    // Si on a un scheduledActivityId, trouver la scheduledActivity correspondante
                    if (scheduledActivityId) {
                      const scheduled = user.templates
                        .flatMap(t => t.scheduledActivities)
                        .find(s => s.id === scheduledActivityId)
                      setSelectedScheduledActivity(scheduled || null)
                    } else {
                      setSelectedScheduledActivity(null)
                    }
                    // Stocker le mode du planner pour déterminer si la modal doit être en readOnly
                    if (mode) {
                      setPlannerMode(mode)
                    }
                    setIsModalOpen(true)
                  }
                }}
              />
            </div>
          </div>

          {/* Panneau latéral de recherche - toujours visible, bandeau étroit quand fermé */}
          <div 
            className={`fixed ${borderRadiusClass} top-24 right-0 bottom-0 bg-white border border-black shadow-lg transition-all duration-300 z-30 ${
              isSearchPanelOpen ? 'w-80' : 'w-12'
            }`}
          >
            <div className={`h-full ${borderRadiusClass} overflow-hidden flex flex-col`}>
              <SearchActivitiesPanel
                activities={user.activities}
                onDragStart={(e, activity) => {
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('activity', JSON.stringify(activity))
                  setDraggedActivity(activity)
                }}
                onDragEnd={() => {
                  setDraggedActivity(null)
                }}
                onActivityClick={handleActivityClick}
                onActivityDoubleClick={handleActivityClick}
                onDelete={handleDelete}
                onCreateActivity={handleCreateActivity}
                disabled={plannerMode === 'calendrier'}
                borderRadiusClass={borderRadiusClass}
                isOpen={isSearchPanelOpen}
                onClose={() => setIsSearchPanelOpen(false)}
                onOpen={() => setIsSearchPanelOpen(true)}
              />
            </div>
          </div>
        </div>
      )}

      <ActivityModal
        activity={selectedActivity}
        activities={user.activities}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedScheduledActivity(null)
        }}
        onSave={handleSaveActivity}
        onDelete={handleDeleteActivity}
        onActivityClick={handleActivityClickInModal}
        readOnly={plannerMode === 'calendrier'}
        scheduledActivity={selectedScheduledActivity}
        onScheduledActivityUpdate={handleScheduledActivityUpdate}
      />
    </div>
  )
}

export default App

