import { useState, useEffect } from 'react'
import { Activity, RecurringActivity, Color } from '../models/Activity'
import { getColorHex, getTextColor } from '../utils/ColorUtils'

interface ActivityModalProps {
  activity: Activity | null | undefined
  activities: Activity[] // Liste de toutes les activités pour afficher les noms dans recurringActivities
  isOpen: boolean
  onClose: () => void
  onSave: (activity: Activity) => void
  onDelete: (id: number | undefined) => void
  onActivityClick?: (activityId: number) => void // Callback pour changer l'activité affichée
}

export default function ActivityModal({
  activity,
  activities,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onActivityClick,
}: ActivityModalProps) {
  const isCreateMode = !activity || !activity.id
  const [isEditing, setIsEditing] = useState(isCreateMode)
  const [isRecurringOpen, setIsRecurringOpen] = useState(false)
  
  const [formData, setFormData] = useState<Activity>({
    id: activity?.id,
    title: activity?.title || '',
    description: activity?.description || '',
    color: activity?.color || Color.TEAL_MUTED,
    recurringActivities: activity?.recurringActivities || [],
  })

  useEffect(() => {
    if (isOpen) {
      if (activity) {
        setFormData({
          id: activity.id,
          title: activity.title,
          description: activity.description,
          color: activity.color,
          recurringActivities: activity.recurringActivities || [],
        })
        setIsEditing(isCreateMode)
      } else {
        setFormData({
          title: '',
          description: '',
          color: Color.TEAL_MUTED,
          recurringActivities: [],
        })
        setIsEditing(true)
      }
    }
  }, [activity, isCreateMode, isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert('Le titre est requis')
      return
    }
    onSave(formData)
    onClose()
  }

  const handleCancel = () => {
    if (isCreateMode) {
      // Vider formData avant de fermer en mode création
      setFormData({
        title: '',
        description: '',
        color: Color.TEAL_MUTED,
        recurringActivities: [],
      })
      onClose()
    } else {
      // Restaurer les données originales et remettre en mode non-édition
      if (activity) {
        setFormData({
          id: activity.id,
          title: activity.title,
          description: activity.description,
          color: activity.color,
          recurringActivities: activity.recurringActivities || [],
        })
      }
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
      onDelete(activity?.id)
      onClose()
    }
  }

  const getActivityName = (id: number): string => {
    const found = activities.find(a => a.id === id)
    return found?.title || `Activité #${id}`
  }

  const backgroundColor = getColorHex(formData.color)
  const textColor = getTextColor(backgroundColor)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className="rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ backgroundColor, color: textColor }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b" style={{ borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de l'activité"
                className="text-2xl font-bold w-full border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              />
            ) : (
              <h2 className="text-2xl font-bold">{formData.title}</h2>
            )}
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de l'activité"
                className="italic w-full mt-2 border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 resize-none opacity-90"
                style={{ color: textColor, backgroundColor: 'transparent' }}
                rows={3}
              />
            ) : (
              <p className="italic mt-2 opacity-90">{formData.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {!isEditing && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Fermer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  style={{ color: textColor }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            {!isCreateMode && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Modifier"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{ color: textColor }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 hover:bg-red-50 rounded-full transition-colors"
                  aria-label="Supprimer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{ color: textColor === '#FFFFFF' ? '#FEE2E2' : '#DC2626' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Panel collapsable pour recurringActivities */}
          <div className="border rounded-lg" style={{ borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}>
            <button
              onClick={() => setIsRecurringOpen(!isRecurringOpen)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform ${isRecurringOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  style={{ color: textColor }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium">
                  Activités récurrentes ({formData.recurringActivities?.length || 0})
                </span>
              </div>
            </button>
            
            {isRecurringOpen && (
              <div className="border-t p-4" style={{ borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}>
                {formData.recurringActivities && formData.recurringActivities.length > 0 ? (
                  <ul className="space-y-2">
                    {formData.recurringActivities.map((recurring, index) => {
                      const targetActivity = activities.find(a => a.id === recurring.targetedActivityId)
                      return (
                        <li key={recurring.id || index} className="p-2 hover:bg-gray-50 rounded">
                          <button
                            onClick={() => {
                              if (onActivityClick && targetActivity) {
                                onActivityClick(recurring.targetedActivityId)
                              }
                            }}
                            className="underline cursor-pointer transition-colors"
                            style={{ 
                              color: textColor === '#FFFFFF' ? '#93C5FD' : '#2563EB',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = textColor === '#FFFFFF' ? '#DBEAFE' : '#1D4ED8'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = textColor === '#FFFFFF' ? '#93C5FD' : '#2563EB'
                            }}
                            disabled={!onActivityClick || !targetActivity}
                          >
                            {getActivityName(recurring.targetedActivityId)} - {recurring.percent}%
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="italic text-sm opacity-75">Aucune activité récurrente</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="flex items-center justify-end gap-4 p-6 border-t" style={{ borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}>
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{ 
                backgroundColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                color: textColor  
              }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{ 
                backgroundColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                color: textColor
              }}
            >
              {isCreateMode ? 'Créer' : 'Modifier'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
