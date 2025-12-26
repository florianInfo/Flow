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
  onActivityDoubleClick?: (activity: Activity) => void
  onDelete?: (id: number | undefined) => void // Handler pour supprimer une activité
  onCreateActivity?: () => void // Handler pour créer une nouvelle activité
  disabled?: boolean
  borderRadiusClass?: string // borderRadiusClass variabilisé passé en prop
  isOpen?: boolean // Indique si le panneau est ouvert
  onClose?: () => void // Handler pour fermer le panneau
  onOpen?: () => void // Handler pour ouvrir le panneau
}

export default function SearchActivitiesPanel({
  activities,
  onDragStart,
  onDragEnd,
  onActivityClick,
  onActivityDoubleClick,
  onDelete,
  onCreateActivity,
  disabled = false,
  borderRadiusClass,
  isOpen = false,
  onClose,
  onOpen,
}: SearchActivitiesPanelProps) {
  const { settings } = useAppSettings()
  const defaultBorderRadiusClass = getBorderRadiusFromSettings(settings)
  const finalBorderRadiusClass = borderRadiusClass || defaultBorderRadiusClass
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

  // Si le panneau n'est pas ouvert, afficher le bandeau vertical
  if (!isOpen) {
    return (
      <div className="h-full cursor-pointer flex items-center justify-center bg-white cursor-pointer hover:bg-gray-50 transition-colors" onClick={onOpen}>
        <div 
          className="text-black font-medium text-lg select-none"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)'
          }}
        >
          Activités
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-2 relative justify-between">
      {onClose && (
        <button
          onClick={onClose}
          className={`relative flex justify-end [&_*]:cursor-pointer ${finalBorderRadiusClass} mb-2 transition-colors z-10`}
          aria-label="Fermer le panneau"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-black"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Champ de recherche */}
      <div className="">
        <input
          type="text"
          placeholder="Rechercher une activité..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`h-8 w-full px-3 py-2 border border-black ${finalBorderRadiusClass} outline-none focus:ring-2 focus:ring-black text-black`}
          style={{
            '--tw-ring-color': '#000000',
          } as React.CSSProperties}
        />
      </div>

      {/* Switch avec borderRadiusClass variabilisé */}
      <div className="">
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm font-medium text-black">Afficher les task</span>
          <button
            type="button"
            onClick={() => setShowTasks(!showTasks)}
            className={`relative inline-flex h-4 w-11 items-center ${finalBorderRadiusClass} transition-colors ${
              showTasks ? 'bg-black' : 'bg-gray-300'
            }`}
            aria-label="Afficher les task"
          >
            <span
              className={`inline-block h-4 w-4 transform ${finalBorderRadiusClass} bg-white transition-transform ${
                showTasks ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Liste des activités - 50vh scrollable */}
      <div 
        className={`overflow-y-auto p-4 flex-shrink-1 ${finalBorderRadiusClass} border border-black`}
        style={{ 
          scrollBehavior: 'smooth', 
          scrollbarWidth: 'thin',
          height: '50%',
          flex: '0 0 50%'
        }}
      >
        {filteredActivities.length > 0 ? (
          <div className="flex flex-col gap-2">
            {filteredActivities.map(activity => (
              <ActivityBadge
                key={activity.id}
                activity={activity}
                onDelete={onDelete}
                draggable={!disabled && !!onDragStart}
                borderRadiusClass={finalBorderRadiusClass}
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
                onDoubleClick={() => {
                  if (!disabled && onActivityDoubleClick) {
                    onActivityDoubleClick(activity)
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <span className="text-gray-500 text-sm">Aucune activité trouvée</span>
        )}
      </div>

      {/* Bouton de création d'activité */}
      {onCreateActivity && (
        <div className="flex-shrink-0">
          <button
            onClick={onCreateActivity}
            className={`h-12 w-full bg-white text-black border border-black p-2 ${finalBorderRadiusClass} shadow-lg hover:bg-black hover:text-white transition-colors cursor-pointer`}
          >
            + Créer une activité
          </button>
        </div>
      )}
    </div>
  )
}

