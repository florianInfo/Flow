import { useState, useEffect, useRef, useCallback } from 'react'
import { Activity, RecurringActivity, Color, Task } from '../models/Activity'
import { ScheduledActivity, Periodicity } from '../models/Planning'
import { getColorHex } from '../utils/ColorUtils'
import RecurringActivitiesSection from './RecurringActivitiesSection'
import TasksList from './TasksList'
import ColorPicker from './ColorPicker'

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
    textColor: activity?.textColor || 'black',
    recurringActivities: activity?.recurringActivities || [],
    tasks: activity?.tasks || [],
  })

  useEffect(() => {
    if (isOpen) {
      if (activity) {
        setFormData({
          id: activity.id,
          title: activity.title,
          description: activity.description,
          color: activity.color,
          textColor: activity.textColor || 'black',
          recurringActivities: activity.recurringActivities || [],
          tasks: activity.tasks || [],
        })
      } else {
        setFormData({
          title: '',
          description: '',
          color: Color.TEAL_MUTED,
          textColor: 'black',
          recurringActivities: [],
          tasks: [],
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
    weekOfMonth: scheduledActivity?.periodicity?.weekOfMonth,
  })

  useEffect(() => {
    if (scheduledActivity?.periodicity) {
      setPeriodicity(scheduledActivity.periodicity)
    } else {
      setPeriodicity({ frequency: 1, unit: 'weekly' })
    }
  }, [scheduledActivity])

  const handlePeriodicityChange = (field: 'frequency' | 'unit' | 'weekOfMonth', value: number | 'daily' | 'weekly' | 'monthly') => {
    if (readOnly || !scheduledActivity) return
    
    let updatedPeriodicity: Periodicity = {
      ...periodicity,
      [field]: value,
    }
    
    // Si on change d'unit vers monthly et qu'on n'a pas de weekOfMonth, mettre 1 par défaut
    if (field === 'unit' && value === 'monthly' && !updatedPeriodicity.weekOfMonth) {
      updatedPeriodicity.weekOfMonth = 1
    }
    
    // Si on change d'unit et ce n'est pas monthly, réinitialiser weekOfMonth
    if (field === 'unit' && value !== 'monthly') {
      updatedPeriodicity.weekOfMonth = undefined
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

  const handleColorChange = (newColor: Color | string) => {
    if (readOnly) return
    const updatedFormData = { ...formData, color: newColor }
    setFormData(updatedFormData)
    // Sauvegarder automatiquement
    onSave(updatedFormData)
  }

  const handleTextColorChange = (newTextColor: 'black' | 'white') => {
    if (readOnly) return
    const updatedFormData = { ...formData, textColor: newTextColor }
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

  const handleTasksUpdate = (updatedTasks: Task[]) => {
    const updatedFormData = {
      ...formData,
      tasks: updatedTasks,
    }
    setFormData(updatedFormData)
  }

  const handleTasksSave = (_activityId: number | undefined, tasks: Task[]) => {
    const updatedFormData = {
      ...formData,
      tasks: tasks,
    }
    setFormData(updatedFormData)
    onSave(updatedFormData)
  }

  const backgroundColor = getColorHex(formData.color)
  const textColor = formData.textColor || 'black'
  const borderColor = textColor === 'white' ? 'rgba(255,255,255,0.3)' : '#000000'
  const selectionBg = textColor === 'white' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'
  const selectionColor = textColor === 'white' ? '#000000' : '#FFFFFF'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        id={`activity-modal-${formData.id || 'new'}`}
        className="shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl p-4"
        style={{ 
          backgroundColor, 
          color: textColor === 'white' ? '#FFFFFF' : '#000000',
        }}
      >
        <style>{`
          #activity-modal-${formData.id || 'new'} ::selection {
            background-color: ${selectionBg};
            color: ${selectionColor};
          }
          #activity-modal-${formData.id || 'new'} ::-moz-selection {
            background-color: ${selectionBg};
            color: ${selectionColor};
          }
        `}</style>
        {/* Header */}
        <div 
          className="flex items-start justify-between mb-2 border-b"
          style={{ borderColor: borderColor }}
        >
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
                className={`text-2xl cursor-text font-bold w-full border outline-none focus:ring-2 px-2 py-1 ${textColor === 'white' ? 'text-white' : 'text-black'}`}
                style={{ 
                  '--tw-ring-color': textColor === 'white' ? '#FFFFFF' : '#000000',
                  backgroundColor: 'transparent',
                  borderColor: borderColor
                } as React.CSSProperties}
              />
            ) : (
              <h2 
                className={`text-2xl font-bold px-4 pt-1 ${textColor === 'white' ? 'text-white' : 'text-black'} ${readOnly ? 'cursor-default' : 'cursor-text'} ${!formData.title ? 'opacity-50' : ''}`}
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
                className={`italic p-2 cursor-text w-full border outline-none focus:ring-2 rounded resize-none ${textColor === 'white' ? 'text-gray-300' : 'text-gray-600'}`}
                style={{ 
                  backgroundColor: 'transparent',
                  '--tw-ring-color': textColor === 'white' ? '#FFFFFF' : '#000000',
                  borderColor: borderColor
                } as React.CSSProperties}
                rows={3}
              />
            ) : (
              <p 
                className={`italic px-4 ${textColor === 'white' ? 'text-gray-300' : 'text-gray-600'} ${readOnly ? 'cursor-default' : 'cursor-text'} ${!formData.description ? 'opacity-50' : ''}`}
                onClick={readOnly ? undefined : () => setIsEditingDescription(true)}
              >
                {formData.description || "Description de l'activité"}
              </p>
            )}
            
            {/* Sélecteur de couleur - masqué en mode lecture seule */}
            {!readOnly && (
              <div className="px-4 py-2">
                <ColorPicker
                  selectedColor={formData.color}
                  onColorChange={handleColorChange}
                  backgroundColor={backgroundColor}
                  textColor={textColor}
                  onTextColorChange={handleTextColorChange}
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {!isCreateMode && !readOnly && (
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                aria-label="Supprimer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 cursor-pointer transition-transform hover:scale-110 ${textColor === 'white' ? 'text-red-300' : 'text-red-600'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
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
              className="p-2 cursor-pointer [&_*]:cursor-pointer hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Fermer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 ${textColor === 'white' ? 'text-white' : 'text-black'}`}
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
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col m-2 gap-2">
          {!readOnly ? (
            <>
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
              <TasksList
                tasks={formData.tasks || []}
                activityId={formData.id}
                userId={activity?.id ? 1 : undefined}
                backgroundColor={backgroundColor}
                textColor={textColor}
                onUpdate={handleTasksUpdate}
                onSave={handleTasksSave}
                isOpen={isOpen}
                maxDepth={10}
              />
            </>
          ) : (
            <>
              <div className="px-4 py-2">
                <h3 className={`font-semibold mb-2 ${textColor === 'white' ? 'text-white' : 'text-black'}`}>Activités récurrentes</h3>
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
                            className={`underline cursor-pointer transition-colors text-left ${textColor === 'white' ? 'text-blue-300 hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'}`}
                            disabled={!onActivityClick || !linkedActivity}
                          >
                            {linkedActivity?.title || `Activité ${recurring.targetedActivityId}`}
                          </button>
                          <span className={textColor === 'white' ? 'text-white' : 'text-black'}>: {recurring.percent}%</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className={`opacity-50 ${textColor === 'white' ? 'text-white' : 'text-black'}`}>Aucune activité récurrente</p>
                )}
              </div>
              <div className="px-4 py-2">
                <h3 className={`font-semibold mb-2 ${textColor === 'white' ? 'text-white' : 'text-black'}`}>Tâches</h3>
                {formData.tasks && formData.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {formData.tasks.map((task, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input type="checkbox" checked={task.isChecked || false} disabled />
                        <span className={textColor === 'white' ? 'text-white' : 'text-black'}>
                          {task.title || 'Tâche sans titre'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`opacity-50 ${textColor === 'white' ? 'text-white' : 'text-black'}`}>Aucune tâche</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Section Fréquence de répétition - uniquement si on édite une scheduledActivity */}
        {scheduledActivity && !readOnly && (
          <div className="border-t p-4" style={{ borderColor: borderColor }}>
            <h3 className={`font-semibold mb-3 ${textColor === 'white' ? 'text-white' : 'text-black'}`}>Fréquence de répétition</h3>
            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="number"
                min="1"
                value={periodicity.frequency}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  handlePeriodicityChange('frequency', value)
                }}
                className={`px-3 py-2 border rounded outline-none focus:ring-2 bg-transparent ${textColor === 'white' ? 'text-white' : 'text-black'}`}
                style={{
                  '--tw-ring-color': textColor === 'white' ? '#FFFFFF' : '#000000',
                  borderColor: borderColor
                } as React.CSSProperties}
                placeholder="Fréquence"
              />
              <select
                value={periodicity.unit}
                onChange={(e) => {
                  const value = e.target.value as 'daily' | 'weekly' | 'monthly'
                  handlePeriodicityChange('unit', value)
                }}
                className={`px-3 py-2 border rounded outline-none focus:ring-2 ${textColor === 'white' ? 'text-white' : 'text-black'}`}
                style={{
                  backgroundColor: backgroundColor,
                  '--tw-ring-color': textColor === 'white' ? '#FFFFFF' : '#000000',
                  borderColor: borderColor
                } as React.CSSProperties}
              >
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
              </select>
              {periodicity.unit === 'monthly' && (
                <select
                  value={periodicity.weekOfMonth || 1}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    handlePeriodicityChange('weekOfMonth', value)
                  }}
                  className={`px-3 py-2 border rounded outline-none focus:ring-2 ${textColor === 'white' ? 'text-white' : 'text-black'}`}
                  style={{
                    backgroundColor: backgroundColor,
                    '--tw-ring-color': textColor === 'white' ? '#FFFFFF' : '#000000',
                    borderColor: borderColor
                  } as React.CSSProperties}
                >
                  <option value="1">1ère semaine</option>
                  <option value="2">2ème semaine</option>
                  <option value="3">3ème semaine</option>
                  <option value="4">4ème semaine</option>
                  <option value="-1">Dernière semaine</option>
                </select>
              )}
            </div>
          </div>
        )}

        {/* Footer - petit espace */}
        <div className="p-4"></div>

      </div>
    </div>
  )
}
