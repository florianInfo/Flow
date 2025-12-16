import { useState, useEffect, useRef } from 'react'
import { Activity, RecurringActivity, Color } from '../models/Activity'
import { getColorHex, getTextColor } from '../utils/ColorUtils'
import { ActivitySearch } from '../utils/ActivitySearch'

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
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  const [isRecurringOpen, setIsRecurringOpen] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isCreatingNewRecurring, setIsCreatingNewRecurring] = useState(false)
  const [newRecurringTitle, setNewRecurringTitle] = useState('')
  const [pendingRecurringTitle, setPendingRecurringTitle] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Activity[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pendingSaveRef = useRef<Activity | null>(null)
  const [shouldSave, setShouldSave] = useState(false)
  
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

        // Créer les données mises à jour
        setFormData(prevFormData => {
          const updatedFormData = {
            ...prevFormData,
            recurringActivities: [...(prevFormData.recurringActivities || []), newRecurringActivity],
          }
          
          // Stocker dans le ref pour sauvegarde ultérieure
          pendingSaveRef.current = updatedFormData
          
          return updatedFormData
        })
        
        setPendingRecurringTitle(null)
        setShouldSave(true)
      }
    }
  }, [activities, pendingRecurringTitle])

  // Sauvegarder quand il y a des données en attente
  useEffect(() => {
    if (shouldSave && pendingSaveRef.current) {
      const dataToSave = pendingSaveRef.current
      pendingSaveRef.current = null
      setShouldSave(false)
      // Utiliser queueMicrotask pour éviter l'erreur de mise à jour pendant le rendu
      queueMicrotask(() => {
        onSave(dataToSave)
      })
    }
  }, [shouldSave, onSave])

  // Réinitialiser les états de recherche et cacher l'input d'ajout quand la modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setIsCreatingNewRecurring(false)
      setNewRecurringTitle('')
      setSearchResults([])
      setShowDropdown(false)
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

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showDropdown])

  if (!isOpen) return null

  const handleTitleChange = (newTitle: string) => {
    const updatedFormData = { ...formData, title: newTitle }
    setFormData(updatedFormData)
    // Sauvegarder automatiquement
    if (newTitle.trim() || !isCreateMode) {
      onSave(updatedFormData)
    }
  }

  const handleDescriptionChange = (newDescription: string) => {
    const updatedFormData = { ...formData, description: newDescription }
    setFormData(updatedFormData)
    // Sauvegarder automatiquement
    onSave(updatedFormData)
  }

  const handleColorChange = (newColor: Color) => {
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

  const handleDeleteRecurring = (index: number) => {
    const newRecurringActivities = [...(formData.recurringActivities || [])]
    newRecurringActivities.splice(index, 1)

    const updatedFormData = {
      ...formData,
      recurringActivities: newRecurringActivities,
    }
    
    setFormData(updatedFormData)
    
    // Sauvegarder automatiquement sans fermer la modal
    onSave(updatedFormData)
  }

  const handleCreateNewRecurring = () => {
    setIsRecurringOpen(true)
    setIsCreatingNewRecurring(true)
    setNewRecurringTitle('')
    setSearchResults([])
    setShowDropdown(false)
  }

  const handleSearchInputChange = (value: string) => {
    setNewRecurringTitle(value)
    
    if (value.trim().length > 0) {
      // Filtrer les activités existantes pour exclure l'activité courante
      const availableActivities = activities.filter(a => a.id !== formData.id)
      const results = ActivitySearch.search(availableActivities, value)
      setSearchResults(results)
      setShowDropdown(results.length > 0)
    } else {
      setSearchResults([])
      setShowDropdown(false)
    }
  }

  const handleSelectExistingActivity = (selectedActivity: Activity) => {
    if (!selectedActivity.id) return

    // Ajouter directement l'activité existante comme recurringActivity
    const newRecurringActivity: RecurringActivity = {
      targetedActivityId: selectedActivity.id,
      percent: 0,
    }

    const updatedFormData = {
      ...formData,
      recurringActivities: [...(formData.recurringActivities || []), newRecurringActivity],
    }

    setFormData(updatedFormData)
    setIsCreatingNewRecurring(false)
    setNewRecurringTitle('')
    setSearchResults([])
    setShowDropdown(false)

    // Sauvegarder automatiquement sans fermer la modal
    onSave(updatedFormData)
  }

  const handleValidateNewRecurring = () => {
    if (!newRecurringTitle.trim()) {
      return
    }

    const title = newRecurringTitle.trim()

    // Vérifier si une activité existante correspond exactement au titre
    const exactMatch = activities.find(
      a => a.id !== formData.id && a.title.toLowerCase() === title.toLowerCase()
    )

    if (exactMatch && exactMatch.id) {
      // Utiliser l'activité existante
      handleSelectExistingActivity(exactMatch)
      return
    }

    // Sinon, créer une nouvelle activité avec juste le titre
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
    setSearchResults([])
    setShowDropdown(false)
  }

  const handleCancelNewRecurring = () => {
    setIsCreatingNewRecurring(false)
    setNewRecurringTitle('')
    setSearchResults([])
    setShowDropdown(false)
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
                className={`text-2xl font-bold px-4 pt-1 cursor-text ${!formData.title ? 'opacity-50' : ''}`}
                onClick={() => setIsEditingTitle(true)}
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
                className={`italic opacity-90 px-4 cursor-text ${!formData.description ? 'opacity-50' : ''}`}
                onClick={() => setIsEditingDescription(true)}
              >
                {formData.description || "Description de l'activité"}
              </p>
            )}
            
            {/* Sélecteur de couleur - toujours visible */}
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
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {!isCreateMode && (
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
          {/* Panel collapsable pour recurringActivities */}
          <div className="border-2 flex flex-col rounded" style={{ 
            borderColor: textColor === '#FFFFFF' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
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
              <div className="min-h-40 border-t flex-1 overflow-y-auto" style={{ borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}>
                <div className="p-2">
                  {isCreatingNewRecurring && (
                    <div className="relative mb-2">
                      <div className="p-2 rounded flex items-center justify-between border" style={{ borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}>
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={newRecurringTitle}
                          onChange={(e) => handleSearchInputChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              // Si on appuie sur Enter et qu'il y a des résultats, sélectionner le premier
                              if (showDropdown && searchResults.length > 0) {
                                handleSelectExistingActivity(searchResults[0])
                              } else {
                                handleValidateNewRecurring()
                              }
                            } else if (e.key === 'Escape') {
                              handleCancelNewRecurring()
                            }
                          }}
                          onFocus={() => {
                            if (newRecurringTitle.trim().length > 0 && searchResults.length > 0) {
                              setShowDropdown(true)
                            }
                          }}
                          placeholder="Rechercher ou créer une activité"
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
                      {showDropdown && searchResults.length > 0 && (
                        <div
                          ref={dropdownRef}
                          className="absolute z-20 w-full mt-1 border rounded shadow-lg max-h-60 overflow-y-auto"
                          style={{
                            backgroundColor: backgroundColor,
                            borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                            color: textColor
                          }}
                        >
                          {searchResults.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => handleSelectExistingActivity(result)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors border-b last:border-b-0"
                              style={{
                                borderColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              }}
                            >
                              <div className="font-medium">{result.title}</div>
                              {result.description && (
                                <div className="text-sm opacity-75 truncate">{result.description}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteRecurring(index)
                                }}
                                onDragStart={(e) => e.stopPropagation()}
                                className="p-1 cursor-pointer hover:bg-gray-100 rounded transition-colors ml-1"
                                aria-label="Supprimer cette activité récurrente"
                                title="Supprimer"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
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
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    !isCreatingNewRecurring && (
                      <p className="italic text-sm opacity-75">Aucune activité récurrente</p>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - petit espace */}
        <div className="p-4"></div>

      </div>
    </div>
  )
}
