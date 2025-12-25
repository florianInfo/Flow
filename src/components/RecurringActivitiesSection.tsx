import { useState, useEffect, useRef } from 'react'
import { Activity, RecurringActivity, Color } from '../models/Activity'
import { ActivitySearch } from '../utils/ActivitySearch'

interface RecurringActivitiesSectionProps {
  recurringActivities: RecurringActivity[]
  activities: Activity[]
  currentActivityId: number | undefined
  backgroundColor: string
  textColor?: 'black' | 'white' // Couleur du texte pour les bordures
  onUpdate: (recurringActivities: RecurringActivity[]) => void
  onActivityClick?: (activityId: number) => void
  onSave: (activity: Activity) => void
  getCurrentActivity: () => Activity
  isOpen: boolean
}

export default function RecurringActivitiesSection({
  recurringActivities,
  activities,
  currentActivityId,
  backgroundColor,
  textColor = 'black',
  onUpdate,
  onActivityClick,
  onSave,
  getCurrentActivity,
  isOpen,
}: RecurringActivitiesSectionProps) {
  const borderColor = textColor === 'white' ? 'rgba(255,255,255,0.3)' : '#000000'
  const [isRecurringOpen, setIsRecurringOpen] = useState(true)
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

  // Détecter quand une nouvelle activité est créée pour l'ajouter aux recurringActivities
  useEffect(() => {
    if (pendingRecurringTitle) {
      const createdActivity = activities.find(a => a.title === pendingRecurringTitle && a.id)
      if (createdActivity && createdActivity.id) {
        // Vérifier que la nouvelle activité créée n'est pas l'activité courante
        if (createdActivity.id === currentActivityId) {
          // Ne pas ajouter l'activité courante à ses propres recurringActivities
          setPendingRecurringTitle(null)
          return
        }

        // Ajouter la nouvelle activité récurrente
        const newRecurringActivity: RecurringActivity = {
          targetedActivityId: createdActivity.id,
          percent: 0,
        }

        const updatedRecurringActivities = [...recurringActivities, newRecurringActivity]
        
        // Stocker dans le ref pour sauvegarde ultérieure
        // S'assurer qu'on sauvegarde bien l'activité courante, pas la nouvelle créée
        const currentActivity = getCurrentActivity()
        // Vérifier que currentActivity correspond bien à l'activité courante
        if (currentActivity.id === currentActivityId) {
          pendingSaveRef.current = {
            ...currentActivity,
            recurringActivities: updatedRecurringActivities,
          }
          
          onUpdate(updatedRecurringActivities)
          setPendingRecurringTitle(null)
          setShouldSave(true)
        } else {
          // Si currentActivity ne correspond pas, réinitialiser et ne rien faire
          setPendingRecurringTitle(null)
        }
      }
    }
  }, [activities, pendingRecurringTitle, recurringActivities, currentActivityId, onUpdate, getCurrentActivity])

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
  // Ouvrir la section par défaut quand la modal s'ouvre
  useEffect(() => {
    if (!isOpen) {
      setIsCreatingNewRecurring(false)
      setNewRecurringTitle('')
      setSearchResults([])
      setShowDropdown(false)
      setIsRecurringOpen(true) // Réinitialiser à ouvert quand la modal se ferme
    } else {
      // Ouvrir la section quand la modal s'ouvre
      setIsRecurringOpen(true)
    }
  }, [isOpen])

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

    const newRecurringActivities = [...recurringActivities]
    const [draggedItem] = newRecurringActivities.splice(draggedIndex, 1)
    newRecurringActivities.splice(dropIndex, 0, draggedItem)

    onUpdate(newRecurringActivities)
    setDraggedIndex(null)
    setDragOverIndex(null)
    
    // Sauvegarder automatiquement
    const currentActivity = getCurrentActivity()
    const updatedActivity = {
      ...currentActivity,
      recurringActivities: newRecurringActivities,
    }
    onSave(updatedActivity)
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
    
    const newRecurringActivities = [...recurringActivities]
    newRecurringActivities[index] = {
      ...newRecurringActivities[index],
      percent: newPercent,
    }

    onUpdate(newRecurringActivities)
    
    // Sauvegarder automatiquement
    const currentActivity = getCurrentActivity()
    const updatedActivity = {
      ...currentActivity,
      recurringActivities: newRecurringActivities,
    }
    onSave(updatedActivity)
  }

  const handleDeleteRecurring = (index: number) => {
    const newRecurringActivities = [...recurringActivities]
    newRecurringActivities.splice(index, 1)

    onUpdate(newRecurringActivities)
    
    // Sauvegarder automatiquement
    const currentActivity = getCurrentActivity()
    const updatedActivity = {
      ...currentActivity,
      recurringActivities: newRecurringActivities,
    }
    onSave(updatedActivity)
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
      const availableActivities = activities.filter(a => a.id !== currentActivityId)
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

    const updatedRecurringActivities = [...recurringActivities, newRecurringActivity]
    onUpdate(updatedRecurringActivities)
    setIsCreatingNewRecurring(false)
    setNewRecurringTitle('')
    setSearchResults([])
    setShowDropdown(false)

    // Sauvegarder automatiquement
    const currentActivity = getCurrentActivity()
    const updatedActivity = {
      ...currentActivity,
      recurringActivities: updatedRecurringActivities,
    }
    onSave(updatedActivity)
  }

  const handleValidateNewRecurring = () => {
    if (!newRecurringTitle.trim()) {
      return
    }

    const title = newRecurringTitle.trim()

    // Vérifier si une activité existante correspond exactement au titre
    const exactMatch = activities.find(
      a => a.id !== currentActivityId && a.title.toLowerCase() === title.toLowerCase()
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

  return (
    <div className="border-2 flex flex-col rounded-2xl" style={{ 
      height: '40%',
      maxHeight: '40vh',
      borderColor: borderColor
    }}>
      <div className="w-full flex items-center justify-between hover:bg-gray-50 transition-colors sticky top-0 z-10" style={{ backgroundColor: backgroundColor }}>
        <button
          onClick={() => setIsRecurringOpen(!isRecurringOpen)}
          className="flex-1 cursor-pointer flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 cursor-pointer transition-transform ${textColor === 'white' ? 'text-white' : 'text-black'} ${isRecurringOpen ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className={`font-medium cursor-pointer ${textColor === 'white' ? 'text-white' : 'text-black'}`}>
            Activités récurrentes ({recurringActivities?.length || 0})
          </span>
        </button>
        <button
          onClick={handleCreateNewRecurring}
          className="p-1 cursor-pointer [&_*]:cursor-pointer hover:bg-gray-100 rounded-xl transition-colors mr-2"
          aria-label="Ajouter une activité récurrente"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
      
      {isRecurringOpen && (
        <div className="min-h-40 border-t flex-1 overflow-y-auto" style={{ borderColor: borderColor }}>
          <div className="p-2">
            {isCreatingNewRecurring && (
              <div className="relative mb-2">
                <div className="p-2 rounded flex items-center justify-between border" style={{ borderColor: borderColor }}>
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
                    className={`flex-1 border outline-none focus:ring-2 rounded px-2 py-1 mr-2 bg-transparent ${textColor === 'white' ? 'text-white' : 'text-black'}`}
                    style={{
                      '--tw-ring-color': textColor === 'white' ? '#FFFFFF' : '#000000',
                      borderColor: borderColor
                    } as React.CSSProperties}
                    autoFocus
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleValidateNewRecurring}
                      className="p-1 cursor-pointer hover:bg-gray-100 rounded-xl transition-colors"
                      aria-label="Valider"
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelNewRecurring}
                      className="p-1 cursor-pointer hover:bg-gray-100 rounded-xl transition-colors"
                      aria-label="Annuler"
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
                {showDropdown && searchResults.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-20 w-full mt-1 border rounded shadow-lg max-h-60 overflow-y-auto"
                    style={{
                      backgroundColor: backgroundColor,
                      borderColor: borderColor
                    }}
                  >
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectExistingActivity(result)}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors border-b last:border-b-0 ${textColor === 'white' ? 'text-white' : 'text-black'}`}
                        style={{ borderColor: borderColor }}
                      >
                        <div className="font-medium">{result.title}</div>
                        {result.description && (
                          <div className={`text-sm truncate ${textColor === 'white' ? 'text-gray-300' : 'text-gray-600'}`}>{result.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {recurringActivities && recurringActivities.length > 0 ? (
              <ul className="space-y-2">
                {recurringActivities.map((recurring, index) => {
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
                        borderBottom: dragOverIndex === index && draggedIndex !== null && draggedIndex < index ? `2px solid ${borderColor}` : 'none',
                        borderTop: dragOverIndex === index && draggedIndex !== null && draggedIndex > index ? `2px solid ${borderColor}` : 'none'
                      }}
                    >
                      <button
                        onClick={() => {
                          if (onActivityClick && targetActivity) {
                            onActivityClick(recurring.targetedActivityId)
                          }
                        }}
                        className={`underline cursor-pointer transition-colors text-left ${textColor === 'white' ? 'text-blue-300 hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'}`}
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
                          className={`w-16 text-right border outline-none focus:ring-2 rounded px-1 py-0.5 bg-transparent ${textColor === 'white' ? 'text-white' : 'text-black'}`}
                          style={{
                            '--tw-ring-color': textColor === 'white' ? '#FFFFFF' : '#000000',
                            borderColor: borderColor
                          } as React.CSSProperties}
                        />
                        <span className={textColor === 'white' ? 'text-white' : 'text-black'}>%</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRecurring(index)
                          }}
                          onDragStart={(e) => e.stopPropagation()}
                          className="p-1 cursor-pointer hover:bg-gray-100 rounded-xl transition-colors ml-1"
                          aria-label="Supprimer cette activité récurrente"
                          title="Supprimer"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ${textColor === 'white' ? 'text-white' : 'text-black'}`}
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
                    </li>
                  )
                })}
              </ul>
            ) : (
              !isCreatingNewRecurring && (
                <p className={`italic text-sm ${textColor === 'white' ? 'text-gray-300' : 'text-gray-600'}`}>Aucune activité récurrente</p>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
