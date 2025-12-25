import { Activity } from '../models/Activity'
import { getColorHex } from '../utils/ColorUtils'

interface ActivityBadgeProps {
  activity: Activity
  onDelete: (id: number | undefined) => void
}

export default function ActivityBadge({ activity, onDelete }: ActivityBadgeProps) {
  const backgroundColor = getColorHex(activity.color)
  const recurringCount = activity.recurringActivities?.length || 0

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm cursor-pointer hover:scale-110 hover:rotate-2 transition-all duration-300 ease-in-out"
      style={{
        backgroundColor,
      }}
    >
      <span className="font-medium cursor-pointer text-black">{activity.title}</span>
      <span className="text-sm text-gray-600 cursor-pointer">({recurringCount})</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(activity.id)
        }}
        className="ml-1 cursor-pointer hover:opacity-70 hover:scale-125 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full text-black"
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
    </div>
  )
}
