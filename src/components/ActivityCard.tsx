import { useState } from 'react'
import { Activity, ActivityStatus, ActivityPriority } from '../models/Activity'

interface ActivityCardProps {
  activity: Activity
  onUpdate: (id: string, activity: Activity) => void
  onDelete: (id: string) => void
}

export default function ActivityCard({ activity, onUpdate, onDelete }: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status: ActivityStatus) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      archived: 'bg-gray-200 text-gray-600',
    }
    return colors[status]
  }

  const getPriorityColor = (priority: ActivityPriority) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600',
    }
    return colors[priority]
  }

  const handleLike = () => {
    activity.like()
    onUpdate(activity.id, activity)
  }

  const handleView = () => {
    activity.incrementViews()
    onUpdate(activity.id, activity)
  }

  const handleShare = () => {
    activity.share()
    onUpdate(activity.id, activity)
  }

  const handleAddTag = () => {
    const tag = prompt('Entrez un tag:')
    if (tag) {
      activity.addTag(tag)
      onUpdate(activity.id, activity)
    }
  }

  const handleStatusChange = (newStatus: ActivityStatus) => {
    try {
      activity.updateStatus(newStatus)
      onUpdate(activity.id, activity)
    } catch (error) {
      alert((error as Error).message)
    }
  }

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {activity.title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
              {activity.status}
            </span>
            <span className={`text-sm font-medium ${getPriorityColor(activity.priority)}`}>
              Priorité: {activity.priority}
            </span>
            {activity.category && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                {activity.category}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      <p className="text-gray-600 mb-4">{activity.description}</p>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Vues:</span> {activity.stats.views}
            </div>
            <div>
              <span className="font-medium text-gray-700">Likes:</span> {activity.stats.likes}
            </div>
            <div>
              <span className="font-medium text-gray-700">Partages:</span> {activity.stats.shares}
            </div>
            <div>
              <span className="font-medium text-gray-700">Score:</span> {activity.score}
            </div>
            {activity.dueDate && (
              <div className="col-span-2">
                <span className="font-medium text-gray-700">Date d'échéance:</span>{' '}
                {new Date(activity.dueDate).toLocaleDateString('fr-FR')}
                {activity.isExpired && (
                  <span className="ml-2 text-red-600 font-medium">(Expiré)</span>
                )}
              </div>
            )}
            <div className="col-span-2">
              <span className="font-medium text-gray-700">Créé le:</span>{' '}
              {activity.createdAt.toLocaleDateString('fr-FR')}
            </div>
          </div>

          {activity.metadata.tags.length > 0 && (
            <div>
              <span className="font-medium text-gray-700 text-sm">Tags:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {activity.metadata.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <select
              value={activity.status}
              onChange={(e) => handleStatusChange(e.target.value as ActivityStatus)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Brouillon</option>
              <option value="active">Actif</option>
              <option value="paused">En pause</option>
              <option value="completed">Terminé</option>
              <option value="archived">Archivé</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={handleView}
          className="btn-secondary text-sm"
        >
          👁️ Voir ({activity.stats.views})
        </button>
        <button
          onClick={handleLike}
          className="btn-secondary text-sm"
        >
          ❤️ Like ({activity.stats.likes})
        </button>
        <button
          onClick={handleShare}
          className="btn-secondary text-sm"
        >
          🔗 Partager ({activity.stats.shares})
        </button>
        <button
          onClick={handleAddTag}
          className="btn-secondary text-sm"
        >
          🏷️ Tag
        </button>
        <button
          onClick={() => onDelete(activity.id)}
          className="btn-secondary text-sm bg-red-100 text-red-800 hover:bg-red-200"
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>
  )
}

