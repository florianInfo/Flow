import { Activity } from '../models/Activity'
import { getColorHex, getTextColor } from '../utils/ColorUtils'

interface SearchActivitiesPanelProps {
  activities: Activity[]
  onDragStart: (e: React.DragEvent, activity: Activity) => void
  onDragEnd: () => void
  disabled?: boolean
}

export default function SearchActivitiesPanel({
  activities,
  onDragStart,
  onDragEnd,
  disabled = false,
}: SearchActivitiesPanelProps) {
  return (
    <div className="p-4 border-b bg-gray-50 flex-shrink-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium">Glissez une activité vers le planner :</span>
        {activities.map(activity => (
          <button
            key={activity.id}
            draggable={!disabled}
            onDragStart={(e) => !disabled && onDragStart(e, activity)}
            onDragEnd={onDragEnd}
            disabled={disabled}
            className={`px-3 py-1 rounded transition-all hover:opacity-80 ${
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-move'
            }`}
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
  )
}

