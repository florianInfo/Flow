import { useState, useEffect } from 'react'
import { Activity } from './models/Activity'
import { ScheduledActivity, PlannedActivity, User } from './models/Planning'
import ActivityBadge from './components/ActivityBadge'
import ActivityModal from './components/ActivityModal'
import Planner from './components/Planner'
import { ActivityDelete } from './utils/ActivityDelete'
import { logApiRequest } from './utils/ApiLogger'

interface ActivitiesData {
  activities: Activity[]
}

type ViewMode = 'activities' | 'planner'

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date())
  const [currentCalendarId] = useState<number>(1)

  useEffect(() => {
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
        }
        break
      }
      
      case 'onScheduledActivityUpdate': {
        const scheduled = params.scheduled as ScheduledActivity
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
        }
        break
      }
      
      case 'onPlannedActivityCreate': {
        const planned = params.planned as PlannedActivity
        const calendar = user.calendars.find(c => c.id === currentCalendarId)
        
        if (calendar) {
          logApiRequest({
            method: 'PATCH',
            path: '/api/users/:userId/calendars/:calendarId',
            pathParams: { userId: user.id!, calendarId: calendar.id! },
            body: {
              plannedActivities: [
                ...calendar.plannedActivities,
                planned
              ]
            }
          })
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

  // Handlers pour le Planner
  const handleScheduledActivityCreate = (scheduled: ScheduledActivity) => {
    // Générer un nouvel ID pour la ScheduledActivity
    const allScheduledIds = user.templates.flatMap(t => t.scheduledActivities.map(s => s.id || 0))
    const newId = allScheduledIds.length > 0 ? Math.max(...allScheduledIds) + 1 : 1
    const newScheduled = { ...scheduled, id: newId }
    
    setUser(prev => {
      // Trouver ou créer le template principal (id: 1)
      const templateId = 1
      const existingTemplate = prev.templates.find(t => t.id === templateId)
      
      if (existingTemplate) {
        // Mettre à jour le template existant
        const updatedTemplate = {
          ...existingTemplate,
          scheduledActivities: [...existingTemplate.scheduledActivities, newScheduled],
        }
        
        return {
          ...prev,
          templates: prev.templates.map(t => t.id === templateId ? updatedTemplate : t),
        }
      } else {
        // Créer un nouveau template
        const newTemplate = {
          id: templateId,
          userId: prev.id!,
          scheduledActivities: [newScheduled],
        }
        
        return {
          ...prev,
          templates: [...prev.templates, newTemplate],
        }
      }
    })
    
    logPlannerUpdate('onScheduledActivityCreate', { scheduled: newScheduled })
  }

  const handleScheduledActivityUpdate = (scheduled: ScheduledActivity) => {
    setUser(prev => ({
      ...prev,
      templates: prev.templates.map(template => ({
        ...template,
        scheduledActivities: template.scheduledActivities.map(s => 
          s.id === scheduled.id ? scheduled : s
        ),
      })),
    }))
    
    logPlannerUpdate('onScheduledActivityUpdate', { scheduled })
  }

  const handlePlannedActivityCreate = (planned: PlannedActivity) => {
    const currentCalendar = user.calendars.find(c => c.id === currentCalendarId)
    if (!currentCalendar) return
    
    const newId = Math.max(...currentCalendar.plannedActivities.map(p => p.id || 0), 0) + 1
    const newPlanned = { ...planned, id: newId }
    
    setUser(prev => ({
      ...prev,
      calendars: prev.calendars.map(cal => 
        cal.id === currentCalendarId
          ? { ...cal, plannedActivities: [...cal.plannedActivities, newPlanned] }
          : cal
      ),
    }))
    
    logPlannerUpdate('onPlannedActivityCreate', { planned: newPlanned })
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
    <div className="min-h-screen bg-gray-50 select-none flex flex-col">
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
          <nav className="flex gap-2">
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
      ) : (
        <main className="flex-1 overflow-hidden">
          <Planner
            activities={user.activities}
            scheduledActivities={user.templates.flatMap(t => t.scheduledActivities)}
            plannedActivities={user.calendars.find(c => c.id === currentCalendarId)?.plannedActivities || []}
            onScheduledActivityCreate={handleScheduledActivityCreate}
            onScheduledActivityUpdate={handleScheduledActivityUpdate}
            onPlannedActivityCreate={handlePlannedActivityCreate}
            onPlannedActivityUpdate={handlePlannedActivityUpdate}
            currentWeek={currentWeek}
            onWeekChange={handleWeekChange}
            onActivityDoubleClick={(activityId) => {
              const activity = user.activities.find(a => a.id === activityId)
              if (activity) {
                setSelectedActivity(activity)
                setIsModalOpen(true)
              }
            }}
          />
        </main>
      )}

      <ActivityModal
        activity={selectedActivity}
        activities={user.activities}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveActivity}
        onDelete={handleDeleteActivity}
        onActivityClick={handleActivityClickInModal}
      />
    </div>
  )
}

export default App

