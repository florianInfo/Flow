import { useState, useEffect } from 'react'
import { AppSettings } from '../models/AppSettings'
import { useAppSettings } from '../hooks/useAppSettings'

export default function Admin() {
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
        </div>
      </div>
    </div>
  )
}

