import { Activity } from '../models/Activity'
import { getColorHex } from '../utils/colors'

interface ActivityBadgeProps {
  activity: Activity
  onDelete: (id: number | undefined) => void
}

export default function ActivityBadge({ activity, onDelete }: ActivityBadgeProps) {
  const backgroundColor = getColorHex(activity.color)
  const recurringCount = activity.recurringActivities?.length || 0

  // Déterminer la couleur du texte en fonction de la luminosité du fond
  const getTextColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    // Calcul de la luminosité relative
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#FFFFFF'
  }

  const textColor = getTextColor(backgroundColor)

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md shadow-sm cursor-pointer hover:scale-110 hover:rotate-2 transition-all duration-300 ease-in-out"
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      <span className="font-medium">{activity.title}</span>
      <span className="text-sm opacity-90">({recurringCount})</span>
      <button
        onClick={() => onDelete(activity.id)}
        className="ml-1 hover:opacity-70 hover:scale-125 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
        style={{
          color: textColor,
        }}
        aria-label="Supprimer l'activité"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}
