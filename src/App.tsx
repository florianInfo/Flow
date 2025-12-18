import { useState, useEffect } from 'react'
import { Activity } from './models/Activity'
import ActivityBadge from './components/ActivityBadge'
import ActivityModal from './components/ActivityModal'
import { ActivityDelete } from './utils/ActivityDelete'

interface ActivitiesData {
  activities: Activity[]
}

function App() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetch('/activity-example.json')
      .then(response => response.json())
      .then((data: ActivitiesData) => {
        // Mélanger les activités pour un effet random
        const shuffled = [...data.activities].sort(() => Math.random() - 0.5)
        setActivities(shuffled)
        setLoading(false)
      })
      .catch(error => {
        console.error('Erreur lors du chargement des activités:', error)
        setLoading(false)
      })
  }, [])

  const handleDelete = (id: number | undefined) => {
    if (id !== undefined) {
      setActivities(ActivityDelete.deleteActivity(activities, id))
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
      setActivities(activities.map(a => a.id === activity.id ? activity : a))
    } else {
      // Créer une nouvelle activité
      const newId = Math.max(...activities.map(a => a.id || 0), 0) + 1
      activity.id = newId
      setActivities([...activities, { ...activity, id: newId }])
    }
  }

  const handleDeleteActivity = (id: number | undefined) => {
    handleDelete(id)
  }

  const handleActivityClickInModal = (activityId: number) => {
    const clickedActivity = activities.find(a => a.id === activityId)
    if (clickedActivity) {
      setSelectedActivity(clickedActivity)
      // Le modal reste ouvert, mais avec la nouvelle activité
    }
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
    <div className="min-h-screen bg-gray-50 select-none">
      <header className="w-full px-4 py-1" style={{ backgroundColor: '#ece3d0' }}>
        <div className="flex items-center">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-20 w-auto"
            onError={(e) => {
              // Fallback si l'image n'existe pas encore
              console.warn('Logo image not found at /logo.png')
            }}
          />
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8 select-none">
        <div className="flex flex-wrap justify-center items-center gap-4 max-w-6xl select-none">
          {activities.map((activity, index) => (
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

      <ActivityModal
        activity={selectedActivity}
        activities={activities}
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

