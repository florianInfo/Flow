import { useState, useEffect } from 'react'
import { Activity } from './models/Activity'
import ActivityBadge from './components/ActivityBadge'

interface ActivitiesData {
  activities: Activity[]
}

function App() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

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
      setActivities(activities.filter(activity => activity.id !== id))
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
    <div className="min-h-screen bg-gray-50">
      <header className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-800">Flow</h1>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8">
        <div className="flex flex-wrap justify-center items-center gap-4 max-w-6xl">
          {activities.map((activity, index) => (
            <div
              key={activity.id || index}
              style={getRandomTransform()}
              className="hover:scale-110 transition-transform duration-300"
            >
              <ActivityBadge
                activity={activity}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App

