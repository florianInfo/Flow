import { Activity } from '../models/Activity'
import { getColorHex } from '../utils/ColorUtils'

interface ActivityBadgeProps {
  activity: Activity
  onDelete?: (id: number | undefined) => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  onClick?: () => void
}

export default function ActivityBadge({ 
  activity, 
  onDelete,
  draggable = false,
  onDragStart,
  onDragEnd,
  onClick,
}: ActivityBadgeProps) {
  const backgroundColor = getColorHex(activity.color)
  const textColor = activity.textColor || 'black'
  const recurringCount = activity.recurringActivities?.length || 0

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-sm transition-all duration-300 ease-in-out border-2 border-black ${
        draggable || onClick ? 'cursor-pointer hover:scale-110 hover:rotate-2' : 'cursor-default'
      }`}
      style={{
        backgroundColor,
      }}
    >
      <span className={`font-medium cursor-pointer ${textColor === 'white' ? 'text-white' : 'text-black'}`}>{activity.title}</span>
      <span className={`text-sm cursor-pointer ${textColor === 'white' ? 'text-gray-300' : 'text-gray-600'}`}>({recurringCount})</span>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(activity.id)
          }}
          className={`ml-1 cursor-pointer hover:opacity-70 hover:scale-125 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-xl ${textColor === 'white' ? 'text-white' : 'text-black'}`}
          aria-label="Supprimer l'activité"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 cursor-pointer"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
            className='cursor-pointer'
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
