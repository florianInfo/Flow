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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isCreatingNewRecurring, setIsCreatingNewRecurring] = useState(false)
  const [newRecurringTitle, setNewRecurringTitle] = useState('')
  const [pendingRecurringTitle, setPendingRecurringTitle] = useState<string | null>(null)
  
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

  // Détecter quand une nouvelle activité est créée pour l'ajouter aux recurringActivities
  useEffect(() => {
    if (pendingRecurringTitle) {
      const createdActivity = activities.find(a => a.title === pendingRecurringTitle && a.id)
      if (createdActivity && createdActivity.id) {
        // Ajouter la nouvelle activité récurrente
        const newRecurringActivity: RecurringActivity = {
          targetedActivityId: createdActivity.id,
          percent: 0,
        }

        setFormData(prevFormData => {
          const updatedFormData = {
            ...prevFormData,
            recurringActivities: [...(prevFormData.recurringActivities || []), newRecurringActivity],
          }
          
          // Sauvegarder automatiquement sans fermer la modal
          onSave(updatedFormData)
          
          return updatedFormData
        })
        
        setPendingRecurringTitle(null)
      }
    }
  }, [activities, pendingRecurringTitle, onSave])

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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newRecurringActivities = [...(formData.recurringActivities || [])]
    const [draggedItem] = newRecurringActivities.splice(draggedIndex, 1)
    newRecurringActivities.splice(dropIndex, 0, draggedItem)

    const updatedFormData = {
      ...formData,
      recurringActivities: newRecurringActivities,
    }
    
    setFormData(updatedFormData)
    setDraggedIndex(null)
    setDragOverIndex(null)
    
    // Sauvegarder automatiquement sans fermer la modal
    onSave(updatedFormData)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handlePercentChange = (index: number, newPercent: number) => {
    if (newPercent < 0 || newPercent > 100) return
    
    const newRecurringActivities = [...(formData.recurringActivities || [])]
    newRecurringActivities[index] = {
      ...newRecurringActivities[index],
      percent: newPercent,
    }

    const updatedFormData = {
      ...formData,
      recurringActivities: newRecurringActivities,
    }
    
    setFormData(updatedFormData)
    
    // Sauvegarder automatiquement sans fermer la modal
    onSave(updatedFormData)
  }

  const handleCreateNewRecurring = () => {
    setIsCreatingNewRecurring(true)
    setNewRecurringTitle('')
  }

  const handleValidateNewRecurring = () => {
    if (!newRecurringTitle.trim()) {
      return
    }

    const title = newRecurringTitle.trim()

    // Créer une nouvelle activité avec juste le titre
    const newActivity: Activity = {
      title: title,
      description: '',
      color: Color.TEAL_MUTED,
      recurringActivities: [],
    }

    // Sauvegarder la nouvelle activité (elle sera créée avec un ID)
    onSave(newActivity)

    // Marquer le titre comme en attente pour le useEffect
    setPendingRecurringTitle(title)
    setIsCreatingNewRecurring(false)
    setNewRecurringTitle('')
  }

  const handleCancelNewRecurring = () => {
    setIsCreatingNewRecurring(false)
    setNewRecurringTitle('')
  }

  const backgroundColor = getColorHex(formData.color)
  const textColor = getTextColor(backgroundColor)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className="shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ backgroundColor, color: textColor }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2" style={{ borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de l'activité"
                className="text-2xl cursor-text font-bold w-full border outline-none focus:ring-2 px-2 py-1"
                style={{ 
                  '--tw-ring-color': textColor,
                  backgroundColor: 'transparent'
                } as React.CSSProperties}
              />
            ) : (
              <h2 className="text-2xl font-bold px-4 pt-1">{formData.title}</h2>
            )}
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de l'activité"
                className="italic p-2 cursor-text w-full border outline-none focus:ring-2 rounded resize-none opacity-90"
                style={{ 
                  color: textColor, 
                  backgroundColor: 'transparent',
                  '--tw-ring-color': textColor 
                } as React.CSSProperties}
                rows={3}
              />
            ) : (
              <p className="italic opacity-90 px-4">{formData.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {!isEditing && (
              <button
                onClick={onClose}
                className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
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
                  className='cursor-pointer'
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col m-2">
          {/* Panel collapsable pour recurringActivities */}
          <div className="border flex flex-col" style={{ 
            borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
            height: '40%',
            maxHeight: '40vh'
          }}>
            <div className="w-full flex items-center justify-between hover:bg-gray-50 transition-colors sticky top-0 z-10" style={{ backgroundColor: backgroundColor }}>
              <button
                onClick={() => setIsRecurringOpen(!isRecurringOpen)}
                className="flex-1 cursor-pointer flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 cursor-pointer transition-transform ${isRecurringOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  style={{ color: textColor }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium cursor-pointer">
                  Activités récurrentes ({formData.recurringActivities?.length || 0})
                </span>
              </button>
              <button
                onClick={handleCreateNewRecurring}
                className="p-1 cursor-pointer hover:bg-gray-100 rounded transition-colors mr-2"
                aria-label="Ajouter une activité récurrente"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
            
            {isRecurringOpen && (
              <div className="border-t flex-1 overflow-y-auto" style={{ borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}>
                <div className="p-2">
                  {isCreatingNewRecurring && (
                    <div className="p-2 rounded flex items-center justify-between mb-2 border" style={{ borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}>
                      <input
                        type="text"
                        value={newRecurringTitle}
                        onChange={(e) => setNewRecurringTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleValidateNewRecurring()
                          } else if (e.key === 'Escape') {
                            handleCancelNewRecurring()
                          }
                        }}
                        placeholder="Titre de la nouvelle activité"
                        className="flex-1 border outline-none focus:ring-2 rounded px-2 py-1 mr-2"
                        style={{
                          '--tw-ring-color': textColor,
                          backgroundColor: 'transparent',
                          color: textColor
                        } as React.CSSProperties}
                        autoFocus
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleValidateNewRecurring}
                          className="p-1 cursor-pointer hover:bg-gray-100 rounded transition-colors"
                          aria-label="Valider"
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={handleCancelNewRecurring}
                          className="p-1 cursor-pointer hover:bg-gray-100 rounded transition-colors"
                          aria-label="Annuler"
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
                      </div>
                    </div>
                  )}
                  {formData.recurringActivities && formData.recurringActivities.length > 0 ? (
                    <ul className="space-y-2">
                      {formData.recurringActivities.map((recurring, index) => {
                        const targetActivity = activities.find(a => a.id === recurring.targetedActivityId)
                        return (
                          <li
                            key={recurring.id || index}
                            draggable={true}
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`p-2 rounded cursor-move flex items-center justify-between ${draggedIndex === index ? 'opacity-50' : ''}`}
                            style={{
                              borderBottom: dragOverIndex === index && draggedIndex !== null && draggedIndex < index ? `2px solid ${textColor}` : 'none',
                              borderTop: dragOverIndex === index && draggedIndex !== null && draggedIndex > index ? `2px solid ${textColor}` : 'none'
                            }}
                          >
                            <button
                              onClick={() => {
                                if (onActivityClick && targetActivity) {
                                  onActivityClick(recurring.targetedActivityId)
                                }
                              }}
                              className="underline cursor-pointer transition-colors text-left"
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
                              {getActivityName(recurring.targetedActivityId)}
                            </button>
                            <div className="flex items-center gap-1 ml-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={recurring.percent}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0
                                  handlePercentChange(index, value)
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onDragStart={(e) => e.stopPropagation()}
                                className="w-16 text-right border outline-none focus:ring-2 rounded px-1 py-0.5"
                                style={{
                                  '--tw-ring-color': textColor,
                                  backgroundColor: 'transparent',
                                  color: textColor
                                } as React.CSSProperties}
                              />
                              <span>%</span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="italic text-sm opacity-75">Aucune activité récurrente</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t" style={{ borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}>
          {isEditing ? (
            <>
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
            </>
          ) : (
            !isCreateMode && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Modifier"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 cursor-pointer"
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
                    className="h-5 w-5 cursor-pointer transition-transform hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{ color: textColor === '#FFFFFF' ? '#FEE2E2' : '#DC2626' }}
                  >
                    <path
                      className='cursor-pointer'
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </>
            )
          )}
        </div>

      </div>
    </div>
  )
}
