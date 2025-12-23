import { useState, useEffect } from 'react'
import { AppSettings, DEFAULT_APP_SETTINGS } from '../models/AppSettings'

const SETTINGS_STORAGE_KEY = 'app_settings'

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [loading, setLoading] = useState(true)

  // Charger les paramètres depuis localStorage au démarrage
  useEffect(() => {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings) as AppSettings
        // Fusionner avec les valeurs par défaut pour s'assurer que toutes les propriétés existent
        setSettings({
          ...DEFAULT_APP_SETTINGS,
          ...parsed,
          planner: {
            ...DEFAULT_APP_SETTINGS.planner,
            ...parsed.planner,
          },
        })
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error)
        setSettings(DEFAULT_APP_SETTINGS)
      }
    }
    setLoading(false)
  }, [])

  // Sauvegarder les paramètres dans localStorage à chaque modification
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    }
  }, [settings, loading])

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      planner: {
        ...prev.planner,
        ...newSettings.planner,
      },
    }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_APP_SETTINGS)
  }

  return {
    settings,
    updateSettings,
    resetSettings,
    loading,
  }
}

