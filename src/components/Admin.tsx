import { useState, useEffect } from 'react'
import { AppSettings } from '../models/AppSettings'
import { useAppSettings } from '../hooks/useAppSettings'
import { User } from '../models/Planning'

interface SavedUser {
  filename: string
  timestamp: number
  data: User
}

interface AdminProps {
  onResetUser?: () => void
  onSaveUser?: () => void
  onLoadUserFromFile?: (event: React.ChangeEvent<HTMLInputElement>) => void
  savedUsers?: SavedUser[]
  onLoadUserFromSave?: (savedUser: SavedUser) => void
  onDeleteSave?: (filename: string, event: React.MouseEvent) => void
}

export default function Admin({ 
  onResetUser,
  onSaveUser,
  onLoadUserFromFile,
  savedUsers = [],
  onLoadUserFromSave,
  onDeleteSave,
}: AdminProps) {
  const { settings, updateSettings, resetSettings } = useAppSettings()
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings)
  const [hasChanges, setHasChanges] = useState(false)

  // Synchroniser localSettings avec settings quand ils changent
  useEffect(() => {
    setLocalSettings(settings)
    setHasChanges(false)
  }, [settings])

  const handlePlannerSettingChange = (key: keyof AppSettings['planner'], value: number) => {
    const newSettings = {
      ...localSettings,
      planner: {
        ...localSettings.planner,
        [key]: value,
      },
    }
    setLocalSettings(newSettings)
    setHasChanges(true)
  }

  const handleSave = () => {
    updateSettings(localSettings)
    setHasChanges(false)
    alert('Paramètres sauvegardés avec succès !')
  }

  const handleReset = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      resetSettings()
      setLocalSettings(settings)
      setHasChanges(false)
      alert('Paramètres réinitialisés aux valeurs par défaut.')
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Administration</h1>
            <div className="flex gap-2">
              {hasChanges && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Enregistrer les modifications
                </button>
              )}
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Section Planner */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4 pb-2 border-b">
              Paramètres du Planner
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Heure de début */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">
                    Heure de début (START_HOUR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={localSettings.planner.startHour}
                    onChange={(e) => handlePlannerSettingChange('startHour', parseInt(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Heure de début de l'affichage du planner (0-23)
                  </p>
                </div>

                {/* Heure de fin */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">
                    Heure de fin (END_HOUR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={localSettings.planner.endHour}
                    onChange={(e) => handlePlannerSettingChange('endHour', parseInt(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Dernière heure affichée dans le planner (0-23)
                  </p>
                </div>

                {/* Hauteur des slots */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">
                    Hauteur des slots (SLOT_HEIGHT)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="200"
                    step="5"
                    value={localSettings.planner.slotHeight}
                    onChange={(e) => handlePlannerSettingChange('slotHeight', parseInt(e.target.value) || 60)}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Hauteur en pixels d'un slot d'une heure (20-200)
                  </p>
                </div>

                {/* Granularité des slots */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">
                    Granularité des slots (SLOT_MINUTES)
                  </label>
                  <select
                    value={localSettings.planner.slotMinutes}
                    onChange={(e) => handlePlannerSettingChange('slotMinutes', parseInt(e.target.value) || 15)}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Granularité des créneaux horaires
                  </p>
                </div>

                {/* Durée par défaut */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">
                    Durée par défaut (DEFAULT_ACTIVITY_DURATION)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    step="5"
                    value={localSettings.planner.defaultActivityDuration}
                    onChange={(e) => handlePlannerSettingChange('defaultActivityDuration', parseInt(e.target.value) || 30)}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Durée par défaut d'une nouvelle activité en minutes (5-480)
                  </p>
                </div>

                {/* Seuil de scroll */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">
                    Seuil de scroll automatique (SCROLL_THRESHOLD)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    step="5"
                    value={localSettings.planner.scrollThreshold}
                    onChange={(e) => handlePlannerSettingChange('scrollThreshold', parseInt(e.target.value) || 50)}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Distance en pixels du bord pour déclencher le scroll automatique (10-200)
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section pour d'autres paramètres futurs */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4 pb-2 border-b">
              Autres paramètres
            </h2>
            <p className="text-gray-500 italic">
              D'autres sections de paramètres pourront être ajoutées ici à l'avenir.
            </p>
          </section>

          {/* Section Sauvegarde et Chargement */}
          {(onSaveUser || onLoadUserFromFile) && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4 pb-2 border-b">
                Sauvegarde et Chargement
              </h2>
              <div className="space-y-4">
                {onSaveUser && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      Sauvegarder le User
                    </h3>
                    <p className="text-blue-700 mb-4">
                      Sauvegarde le user actuel sous forme de fichier JSON sur votre bureau (user_planner_V1.json, V2, etc.)
                      {typeof window !== 'undefined' && 'showSaveFilePicker' in window ? (
                        <span className="block mt-2 text-sm text-blue-600">
                          ✓ Votre navigateur supporte la sauvegarde directe sur le bureau
                        </span>
                      ) : (
                        <span className="block mt-2 text-sm text-blue-600">
                          ℹ Le fichier sera téléchargé dans votre dossier de téléchargement. Vous pouvez le déplacer sur votre bureau.
                        </span>
                      )}
                    </p>
                    <button
                      onClick={onSaveUser}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                    >
                      Sauvegarder le User sur le Bureau
                    </button>
                  </div>
                )}

                {onLoadUserFromFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Charger un User depuis un fichier
                    </h3>
                    <p className="text-green-700 mb-4">
                      Sélectionnez un fichier JSON pour charger un user sauvegardé.
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={onLoadUserFromFile}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                    />
                  </div>
                )}

                {savedUsers && savedUsers.length > 0 && onLoadUserFromSave && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Sauvegardes récentes
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm">
                      Cliquez sur une sauvegarde pour la charger. Les fichiers sont stockés dans votre navigateur.
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {savedUsers
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map((savedUser) => (
                          <div
                            key={savedUser.filename}
                            onClick={() => onLoadUserFromSave(savedUser)}
                            className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">
                                {savedUser.filename}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(savedUser.timestamp).toLocaleString('fr-FR')}
                              </div>
                            </div>
                            {onDeleteSave && (
                              <button
                                onClick={(e) => onDeleteSave(savedUser.filename, e)}
                                className="ml-2 px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Supprimer de la liste"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section Réinitialisation du User */}
          {onResetUser && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4 pb-2 border-b">
                Réinitialisation
              </h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Zone de danger
                </h3>
                <p className="text-red-700 mb-4">
                  Cette action va supprimer toutes vos activités, templates et calendriers et créer un nouveau user vierge avec un calendrier et un template par défaut.
                </p>
                <button
                  onClick={onResetUser}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
                >
                  Réinitialiser le User
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

