import { useState, useEffect } from 'react'
import { Activity } from './models/Activity'
import { ScheduledActivity, PlannedActivity, User } from './models/Planning'
import ActivityBadge from './components/ActivityBadge'
import ActivityModal from './components/ActivityModal'
import Planner from './components/Planner'
import Admin from './components/Admin'
import SearchActivitiesPanel from './components/SearchActivitiesPanel'
import { ActivityDelete } from './utils/ActivityDelete'
import { logApiRequest } from './utils/ApiLogger'
import { generatePlannedActivities } from './utils/PlannedActivityGenerator'

interface ActivitiesData {
  activities: Activity[]
}

type ViewMode = 'activities' | 'planner' | 'admin'

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('activities')
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
  const [isActivitiesPanelOpen, setIsActivitiesPanelOpen] = useState(true)
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

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity)
    setIsModalOpen(true)
  }

  const handleCreateActivity = () => {
    setSelectedActivity(null)
    setIsModalOpen(true)
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


  const handleWeekChange = (weekStart: Date) => {
    setCurrentWeek(weekStart)
    logPlannerUpdate('onWeekChange', { weekStart })
  }

  // Générer des transformations aléatoires pour chaque badge
  const getRandomTransform = () => {
    const rotation = (Math.random() - 0.5) * 10 // Rotation entre -5° et 5°
    const translateX = (Math.random() - 0.5) * 20 // Translation X entre -10px et 10px
    const translateY = (Math.random() - 0.5) * 20 // Translation Y entre -10px et 10px
    return {
      transform: `rotate(${rotation}deg) translate(${translateX}px, ${translateY}px)`,
      transition: 'transform 0.3s ease-in-out'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Chargement des activités...</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 select-none flex flex-col overflow-hidden">
      <header className="w-full px-4 py-1 flex-shrink-0" style={{ backgroundColor: '#ece3d0' }}>
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
          
          {/* Navigation entre les vues */}
          <nav className="flex gap-2 items-center">
            <button
              onClick={() => setViewMode('activities')}
              className={`px-4 py-2 rounded transition-colors ${
                viewMode === 'activities'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Activités
            </button>
            <button
              onClick={() => setViewMode('planner')}
              className={`px-4 py-2 rounded transition-colors ${
                viewMode === 'planner'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Planner
            </button>
            <button
              onClick={() => setViewMode('admin')}
              className={`px-4 py-2 rounded transition-colors ${
                viewMode === 'admin'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Admin
            </button>
          </nav>
        </div>
      </header>

      {viewMode === 'activities' ? (
        <main className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8 select-none flex-1">
          <div className="flex flex-wrap justify-center items-center gap-4 max-w-6xl select-none">
            {user.activities.map((activity, index) => (
              <div
                key={activity.id || index}
                style={getRandomTransform()}
                className="cursor-pointer hover:scale-110 transition-transform duration-300"
                onClick={() => handleActivityClick(activity)}
              >
                <ActivityBadge
                  activity={activity}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
          
          <button
            onClick={handleCreateActivity}
            className="fixed bottom-8 right-8 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            + Créer une activité
          </button>
        </main>
      ) : viewMode === 'admin' ? (
        <Admin />
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {/* Panneau collapsable pour les activités */}
          <div className="border-b bg-gray-50">
            <button
              onClick={() => setIsActivitiesPanelOpen(!isActivitiesPanelOpen)}
              className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Activités disponibles</span>
              <span className="text-gray-500">
                {isActivitiesPanelOpen ? '▼' : '▶'}
              </span>
            </button>
            {isActivitiesPanelOpen && (
              <div className="border-t">
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
                  disabled={plannerMode === 'calendrier'}
                />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-h-0 overflow-hidden">
            <Planner
              activities={user.activities}
              scheduledActivities={user.templates.flatMap(t => t.scheduledActivities)}
              plannedActivities={user.calendars.find(c => c.id === currentCalendarId)?.plannedActivities || []}
              onScheduledActivityCreate={handleScheduledActivityCreate}
              onScheduledActivityUpdate={handleScheduledActivityUpdate}
              onScheduledActivityDelete={handleScheduledActivityDelete}
              onPlannedActivityUpdate={handlePlannedActivityUpdate}
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

