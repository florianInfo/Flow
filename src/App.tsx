import { useState } from 'react'
import { Activity } from './models/Activity'
import ActivityCard from './components/ActivityCard'
import ActivityForm from './components/ActivityForm'

function App() {
  const [activities, setActivities] = useState<Activity[]>([])

  const handleAddActivity = (activity: Activity) => {
    setActivities(prev => [...prev, activity])
  }

  const handleUpdateActivity = (id: string, updatedActivity: Activity) => {
    setActivities(prev =>
      prev.map(activity => activity.id === id ? updatedActivity : activity)
    )
  }

  const handleDeleteActivity = (id: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== id))
    Activity.removeFromRegistry(id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Flow - Gestionnaire d'Activités
          </h1>
          <p className="text-gray-600 mt-2">
            Total d'activités: {Activity.getTotalCount()}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-1">
            <ActivityForm onAdd={handleAddActivity} />
          </div>

          {/* Liste des activités */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-gray-500 text-lg">
                    Aucune activité pour le moment
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Créez votre première activité ci-contre
                  </p>
                </div>
              ) : (
                activities.map(activity => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onUpdate={handleUpdateActivity}
                    onDelete={handleDeleteActivity}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

