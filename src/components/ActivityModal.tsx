import { useState, useEffect, useRef, useCallback } from 'react'
import { Activity, RecurringActivity, Color } from '../models/Activity'
import { ScheduledActivity, Periodicity } from '../models/Planning'
import { getColorHex, getTextColor } from '../utils/ColorUtils'
import RecurringActivitiesSection from './RecurringActivitiesSection'

interface ActivityModalProps {
  activity: Activity | null | undefined
  activities: Activity[] // Liste de toutes les activités pour afficher les noms dans recurringActivities
  isOpen: boolean
  onClose: () => void
  onSave: (activity: Activity) => void
  onDelete: (id: number | undefined) => void
  onActivityClick?: (activityId: number) => void // Callback pour changer l'activité affichée
  readOnly?: boolean // Mode lecture seule
  scheduledActivity?: ScheduledActivity | null // ScheduledActivity si on édite une routine
  onScheduledActivityUpdate?: (scheduled: ScheduledActivity) => void // Callback pour mettre à jour la scheduledActivity
}

export default function ActivityModal({
  activity,
  activities,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onActivityClick,
  readOnly = false,
  scheduledActivity,
  onScheduledActivityUpdate,
}: ActivityModalProps) {
  const isCreateMode = !activity || !activity.id
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  
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
      } else {
        setFormData({
          title: '',
          description: '',
          color: Color.TEAL_MUTED,
          recurringActivities: [],
        })
      }
      setIsEditingTitle(false)
      setIsEditingDescription(false)
    }
  }, [activity, isOpen])

  // Réinitialiser les états quand la modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setIsEditingTitle(false)
      setIsEditingDescription(false)
    }
  }, [isOpen])

  // Focus sur l'input quand on passe en mode édition
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [isEditingTitle])

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus()
    }
  }, [isEditingDescription])

  const getCurrentActivity = useCallback(() => formData, [formData])

  // État pour la périodicité de la scheduledActivity
  const [periodicity, setPeriodicity] = useState<Periodicity>({
    frequency: scheduledActivity?.periodicity?.frequency || 1,
    unit: scheduledActivity?.periodicity?.unit || 'weekly',
  })

  useEffect(() => {
    if (scheduledActivity?.periodicity) {
      setPeriodicity(scheduledActivity.periodicity)
    } else {
      setPeriodicity({ frequency: 1, unit: 'weekly' })
    }
  }, [scheduledActivity])

  const handlePeriodicityChange = (field: 'frequency' | 'unit', value: number | 'daily' | 'weekly' | 'monthly') => {
    if (readOnly || !scheduledActivity) return
    
    const updatedPeriodicity: Periodicity = {
      ...periodicity,
      [field]: value,
    }
    setPeriodicity(updatedPeriodicity)
    
    // Mettre à jour la scheduledActivity
    if (onScheduledActivityUpdate) {
      const updated: ScheduledActivity = {
        ...scheduledActivity,
        periodicity: updatedPeriodicity,
      }
      onScheduledActivityUpdate(updated)
    }
  }

  if (!isOpen) return null

  const handleTitleChange = (newTitle: string) => {
    if (readOnly) return
    const updatedFormData = { ...formData, title: newTitle }
    setFormData(updatedFormData)
    // Sauvegarder automatiquement
    if (newTitle.trim() || !isCreateMode) {
      onSave(updatedFormData)
    }
  }

  const handleDescriptionChange = (newDescription: string) => {
    if (readOnly) return
    const updatedFormData = { ...formData, description: newDescription }
    setFormData(updatedFormData)
    // Sauvegarder automatiquement
    onSave(updatedFormData)
  }

  const handleColorChange = (newColor: Color) => {
    if (readOnly) return
    const updatedFormData = { ...formData, color: newColor }
    setFormData(updatedFormData)
    // Sauvegarder automatiquement
    onSave(updatedFormData)
  }

  const handleTitleBlur = () => {
    setIsEditingTitle(false)
    // Si le titre est vide en mode création, on peut le laisser vide ou mettre un placeholder
    if (!formData.title.trim() && isCreateMode) {
      // Optionnel : remettre un titre par défaut ou laisser vide
    }
  }

  const handleDescriptionBlur = () => {
    setIsEditingDescription(false)
  }

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
      onDelete(activity?.id)
      onClose()
    }
  }

  const handleRecurringActivitiesUpdate = (updatedRecurringActivities: RecurringActivity[]) => {
    const updatedFormData = {
      ...formData,
      recurringActivities: updatedRecurringActivities,
    }
    setFormData(updatedFormData)
  }

  const handleRecurringActivitiesSave = (activityToSave: Activity) => {
    // Ne mettre à jour formData que si c'est l'activité courante (même ID)
    // Sinon, c'est une nouvelle activité à créer, on ne touche pas à formData
    if (activityToSave.id && activityToSave.id === formData.id) {
      setFormData(activityToSave)
    }
    onSave(activityToSave)
  }

  const backgroundColor = getColorHex(formData.color)
  const textColor = getTextColor(backgroundColor)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className="shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded"
        style={{ backgroundColor, color: textColor }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2" style={{ borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}>
          <div className="flex-1">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur()
                  } else if (e.key === 'Escape') {
                    if (activity) {
                      setFormData({ ...formData, title: activity.title })
                    }
                    setIsEditingTitle(false)
                  }
                }}
                placeholder="Titre de l'activité"
                className="text-2xl cursor-text font-bold w-full border outline-none focus:ring-2 px-2 py-1"
                style={{ 
                  '--tw-ring-color': textColor,
                  backgroundColor: 'transparent'
                } as React.CSSProperties}
              />
            ) : (
              <h2 
                className={`text-2xl font-bold px-4 pt-1 ${readOnly ? 'cursor-default' : 'cursor-text'} ${!formData.title ? 'opacity-50' : ''}`}
                onClick={readOnly ? undefined : () => setIsEditingTitle(true)}
              >
                {formData.title || "Titre de l'activité"}
              </h2>
            )}
            {isEditingDescription ? (
              <textarea
                ref={descriptionInputRef}
                value={formData.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                onBlur={handleDescriptionBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    if (activity) {
                      setFormData({ ...formData, description: activity.description })
                    }
                    setIsEditingDescription(false)
                  }
                }}
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
              <p 
                className={`italic opacity-90 px-4 ${readOnly ? 'cursor-default' : 'cursor-text'} ${!formData.description ? 'opacity-50' : ''}`}
                onClick={readOnly ? undefined : () => setIsEditingDescription(true)}
              >
                {formData.description || "Description de l'activité"}
              </p>
            )}
            
            {/* Sélecteur de couleur - masqué en mode lecture seule */}
            {!readOnly && (
              <div className="flex items-center gap-2 px-4 py-2 flex-wrap">
                {Object.values(Color).map((color) => {
                  const colorHex = getColorHex(color)
                  const isSelected = formData.color === color
                  return (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-8 h-8 rounded transition-all ${
                        isSelected ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: colorHex,
                        '--tw-ring-color': textColor,
                        '--tw-ring-offset-color': backgroundColor,
                      } as React.CSSProperties}
                      aria-label={`Sélectionner la couleur ${color}`}
                      title={color}
                    />
                  )
                })}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {!isCreateMode && !readOnly && (
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
            )}
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
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col m-2">
          {!readOnly ? (
            <RecurringActivitiesSection
              recurringActivities={formData.recurringActivities || []}
              activities={activities}
              currentActivityId={formData.id}
              backgroundColor={backgroundColor}
              textColor={textColor}
              onUpdate={handleRecurringActivitiesUpdate}
              onActivityClick={onActivityClick}
              onSave={handleRecurringActivitiesSave}
              getCurrentActivity={getCurrentActivity}
              isOpen={isOpen}
            />
          ) : (
            <div className="px-4 py-2">
              <h3 className="font-semibold mb-2" style={{ color: textColor }}>Activités récurrentes</h3>
              {formData.recurringActivities && formData.recurringActivities.length > 0 ? (
                <div className="space-y-2">
                  {formData.recurringActivities.map((recurring, index) => {
                    const linkedActivity = activities.find(a => a.id === recurring.targetedActivityId)
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (onActivityClick && linkedActivity?.id) {
                              onActivityClick(linkedActivity.id)
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
                          disabled={!onActivityClick || !linkedActivity}
                        >
                          {linkedActivity?.title || `Activité ${recurring.targetedActivityId}`}
                        </button>
                        <span style={{ color: textColor }}>: {recurring.percent}%</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="opacity-50" style={{ color: textColor }}>Aucune activité récurrente</p>
              )}
            </div>
          )}
        </div>

        {/* Section Fréquence de répétition - uniquement si on édite une scheduledActivity */}
        {scheduledActivity && !readOnly && (
          <div className="border-t p-4" style={{ borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}>
            <h3 className="font-semibold mb-3" style={{ color: textColor }}>Fréquence de répétition</h3>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                value={periodicity.frequency}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  handlePeriodicityChange('frequency', value)
                }}
                className="px-3 py-2 border rounded outline-none focus:ring-2"
                style={{
                  color: textColor,
                  backgroundColor: 'transparent',
                  borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                  '--tw-ring-color': textColor,
                } as React.CSSProperties}
                placeholder="Fréquence"
              />
              <select
                value={periodicity.unit}
                onChange={(e) => {
                  const value = e.target.value as 'daily' | 'weekly' | 'monthly'
                  handlePeriodicityChange('unit', value)
                }}
                className="px-3 py-2 border rounded outline-none focus:ring-2"
                style={{
                  color: textColor,
                  backgroundColor: backgroundColor,
                  borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                  '--tw-ring-color': textColor,
                } as React.CSSProperties}
              >
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
              </select>
            </div>
          </div>
        )}

        {/* Footer - petit espace */}
        <div className="p-4"></div>

      </div>
    </div>
  )
}
