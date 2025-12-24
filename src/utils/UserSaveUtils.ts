import { User } from '../models/Planning'

export interface SavedUser {
  filename: string
  timestamp: number
  data: User
}

const SAVED_USERS_STORAGE_KEY = 'saved_users'

/**
 * Récupère toutes les sauvegardes depuis localStorage
 */
export function getSavedUsers(): SavedUser[] {
  const saved = localStorage.getItem(SAVED_USERS_STORAGE_KEY)
  if (!saved) return []
  try {
    return JSON.parse(saved)
  } catch {
    return []
  }
}

/**
 * Calcule le prochain numéro de version pour un nouveau fichier de sauvegarde
 */
export function getNextVersionNumber(): number {
  const saves = getSavedUsers()
  if (saves.length === 0) return 1
  const versions = saves
    .map(save => {
      const match = save.filename.match(/user_planner_V(\d+)\.json/)
      return match ? parseInt(match[1]) : 0
    })
    .filter(v => v > 0)
  return versions.length > 0 ? Math.max(...versions) + 1 : 1
}

/**
 * Ajoute une sauvegarde à la liste dans localStorage
 */
function addSavedUserToHistory(filename: string, user: User): void {
  const saves = getSavedUsers()
  saves.push({
    filename,
    timestamp: Date.now(),
    data: user,
  })
  localStorage.setItem(SAVED_USERS_STORAGE_KEY, JSON.stringify(saves))
}

/**
 * Sauvegarde le user en utilisant l'API File System Access si disponible,
 * sinon utilise le téléchargement classique
 */
export async function saveUserToFile(user: User): Promise<{ success: boolean; filename: string; message: string }> {
  const version = getNextVersionNumber()
  const filename = `user_planner_V${version}.json`
  const dataStr = JSON.stringify(user, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })

  // Essayer d'utiliser l'API File System Access (Chrome, Edge)
  if ('showSaveFilePicker' in window) {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'JSON files',
          accept: { 'application/json': ['.json'] },
        }],
      })
      
      const writable = await fileHandle.createWritable()
      await writable.write(dataBlob)
      await writable.close()

      addSavedUserToHistory(filename, user)
      return {
        success: true,
        filename,
        message: `User sauvegardé sous ${filename} sur votre bureau (ou emplacement choisi)`,
      }
    } catch (error: any) {
      // Si l'utilisateur annule, ne rien faire
      if (error.name === 'AbortError') {
        return {
          success: false,
          filename: '',
          message: 'Sauvegarde annulée',
        }
      }
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  // Fallback : téléchargement classique
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  addSavedUserToHistory(filename, user)
  return {
    success: true,
    filename,
    message: `User sauvegardé sous ${filename}. Veuillez le déplacer sur votre bureau si nécessaire.`,
  }
}

/**
 * Charge un user depuis un fichier JSON
 */
export function loadUserFromFile(
  file: File,
  onSuccess: (user: User) => void,
  onError?: (error: Error) => void
): void {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const loadedUser = JSON.parse(content) as User
      onSuccess(loadedUser)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur lors du parsing du fichier')
      if (onError) {
        onError(err)
      } else {
        console.error('Erreur lors du chargement:', err)
      }
    }
  }
  reader.onerror = () => {
    const err = new Error('Erreur lors de la lecture du fichier')
    if (onError) {
      onError(err)
    } else {
      console.error(err)
    }
  }
  reader.readAsText(file)
}

/**
 * Supprime une sauvegarde de la liste
 */
export function deleteSavedUser(filename: string): void {
  const saves = getSavedUsers()
  const filtered = saves.filter(s => s.filename !== filename)
  localStorage.setItem(SAVED_USERS_STORAGE_KEY, JSON.stringify(filtered))
}

