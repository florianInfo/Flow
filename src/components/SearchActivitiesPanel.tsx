import { useState } from 'react'
import { Activity } from '../models/Activity'
import { ActivitySearch, type SearchRule } from '../utils/ActivitySearch'
import ActivityBadge from './ActivityBadge'
import { useAppSettings } from '../contexts/AppSettingsContext'
import { getBorderRadiusFromSettings } from '../utils/BorderRadiusUtils'

interface SearchActivitiesPanelProps {
  activities: Activity[]
  onDragStart?: (e: React.DragEvent, activity: Activity) => void
  onDragEnd?: () => void
  onActivityClick?: (activity: Activity) => void
  onDelete?: (id: number | undefined) => void // Handler pour supprimer une activité
  disabled?: boolean
  showDragHint?: boolean // Afficher le texte "Glissez une activité vers le planner"
  maxHeight?: string // Hauteur maximale pour contrôler la taille et le scroll
}

export default function SearchActivitiesPanel({
  activities,
  onDragStart,
  onDragEnd,
  onActivityClick,
  onDelete,
  disabled = false,
  maxHeight,
}: SearchActivitiesPanelProps) {
  const { settings } = useAppSettings()
  const borderRadiusClass = getBorderRadiusFromSettings(settings)
  const [searchTerm, setSearchTerm] = useState('')
  const [showTasks, setShowTasks] = useState(true) // Par défaut, afficher les tasks (activités avec recurringActivities)

  // Règle de recherche par défaut (titre et description)
  const defaultSearchRules: SearchRule[] = ActivitySearch.getDefaultSearchRules()

  // Filtrer les activités selon le filtre "afficher les task"
  const taskFilteredActivities = !showTasks
    ? activities.filter(activity => activity.recurringActivities && activity.recurringActivities.length > 0)
    : activities

  // Filtrer selon le terme de recherche
  const filteredActivities = searchTerm.trim()
    ? ActivitySearch.search(taskFilteredActivities, searchTerm, defaultSearchRules)
    : taskFilteredActivities

  return (
    <div className="p-4 flex-shrink-0 flex flex-col" style={{ maxHeight: maxHeight || 'none' }}>
      {/* Barre de recherche et switch */}
      <div className="flex items-center gap-4 mb-3 flex-shrink-0">
        <input
          type="text"
          placeholder="Rechercher une activité..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-black rounded-xl outline-none focus:ring-2 focus:ring-black text-black"
          style={{
            '--tw-ring-color': '#000000',
          } as React.CSSProperties}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm font-medium text-black">Afficher les task</span>
          <button
            type="button"
            onClick={() => setShowTasks(!showTasks)}
            className={`relative inline-flex h-6 w-11 items-center rounded-xl transition-colors ${
              showTasks ? 'bg-black' : 'bg-gray-300'
            }`}
            aria-label="Afficher les task"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-xl bg-white transition-transform ${
                showTasks ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Liste des activités */}
      <div 
        className="flex items-center gap-2 flex-wrap overflow-y-auto" 
        style={{ 
          scrollBehavior: 'smooth', 
          scrollbarWidth: 'thin',
          maxHeight: maxHeight ? `calc(${maxHeight}` : 'none',
          overflowY: maxHeight ? 'auto' : 'visible'
        }}
      >
        {filteredActivities.length > 0 ? (
          filteredActivities.map(activity => (
            <ActivityBadge
              key={activity.id}
              activity={activity}
              onDelete={onDelete}
              draggable={!disabled && !!onDragStart}
              borderRadiusClass={borderRadiusClass}
              onDragStart={(e) => {
                if (!disabled && onDragStart) {
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('activity', JSON.stringify(activity))
                  onDragStart(e, activity)
                }
              }}
              onDragEnd={() => {
                if (onDragEnd) {
                  onDragEnd()
                }
              }}
              onClick={() => {
                if (!disabled && onActivityClick) {
                  onActivityClick(activity)
                }
              }}
            />
          ))
        ) : (
          <span className="text-gray-500 text-sm">Aucune activité trouvée</span>
        )}
      </div>
    </div>
  )
}

