import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AppSettings, DEFAULT_APP_SETTINGS } from '../models/AppSettings'

const SETTINGS_STORAGE_KEY = 'app_settings'

interface AppSettingsContextType {
  settings: AppSettings
  updateSettings: (newSettings: Partial<AppSettings>) => void
  resetSettings: () => void
  loading: boolean
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined)

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [loading, setLoading] = useState(true)

  // Charger les paramètres depuis localStorage au démarrage
  useEffect(() => {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings) as AppSettings
        setSettings({
          ...DEFAULT_APP_SETTINGS,
          ...parsed,
          planner: {
            ...DEFAULT_APP_SETTINGS.planner,
            ...parsed.planner,
          },
          design: {
            ...DEFAULT_APP_SETTINGS.design,
            ...parsed.design,
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
    setSettings(prev => {
      const updated: AppSettings = {
        planner: {
          ...prev.planner,
          ...(newSettings.planner || {}),
        },
        design: {
          ...prev.design,
          ...(newSettings.design || {}),
        },
      }
      return updated
    })
  }

  const resetSettings = () => {
    setSettings(DEFAULT_APP_SETTINGS)
  }

  return (
    <AppSettingsContext.Provider value={{ settings, updateSettings, resetSettings, loading }}>
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext)
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider')
  }
  return context
}
