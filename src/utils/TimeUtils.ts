/**
 * Convertit une heure au format HH:mm en minutes depuis minuit
 * 
 * @param time - Heure au format HH:mm (ex: "14:30")
 * @returns Nombre de minutes depuis minuit (ex: 870 pour 14:30)
 * 
 * @example
 * timeToMinutes("14:30") // 870
 * timeToMinutes("09:00") // 540
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convertit des minutes depuis minuit en format HH:mm
 * 
 * @param minutes - Nombre de minutes depuis minuit
 * @returns Heure au format HH:mm (ex: "14:30")
 * 
 * @example
 * minutesToTime(870) // "14:30"
 * minutesToTime(540) // "09:00"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Ajuste les heures de début/fin dans les limites définies
 * Si l'activité dépasse les limites, elle est ajustée pour rester dans les bornes
 * 
 * @param hour - Heure de début
 * @param minute - Minute de début
 * @param duration - Durée en minutes
 * @param startHour - Heure de début minimale (ex: 6)
 * @param endHour - Heure de fin maximale (ex: 22)
 * @returns Objet avec startMinutes et endMinutes ajustés, ou null si la durée est trop grande
 * 
 * @example
 * adjustTimeBounds(23, 0, 60, 6, 22) // { startMinutes: 1320, endMinutes: 1380 }
 * adjustTimeBounds(5, 0, 30, 6, 22) // { startMinutes: 360, endMinutes: 390 }
 */
export function adjustTimeBounds(
  hour: number,
  minute: number,
  duration: number,
  startHour: number,
  endHour: number
): { startMinutes: number; endMinutes: number } | null {
  let startMinutes = hour * 60 + minute
  let endMinutes = startMinutes + duration
  const maxMinutes = (endHour + 1) * 60
  const minMinutes = startHour * 60

  // Ajuster si l'activité dépasse la limite supérieure
  if (endMinutes > maxMinutes) {
    endMinutes = maxMinutes
    startMinutes = endMinutes - duration
  }

  // Ajuster si l'activité commence avant la limite inférieure
  if (startMinutes < minMinutes) {
    startMinutes = minMinutes
    endMinutes = startMinutes + duration
    // Si après ajustement, ça dépasse encore, limiter
    if (endMinutes > maxMinutes) {
      endMinutes = maxMinutes
      startMinutes = endMinutes - duration
      // Si la durée est trop grande, ne pas permettre
      if (startMinutes < minMinutes) {
        return null
      }
    }
  }

  return { startMinutes, endMinutes }
}

/**
 * Calcule la durée en minutes entre deux heures
 * 
 * @param startTime - Heure de début au format HH:mm
 * @param endTime - Heure de fin au format HH:mm
 * @returns Durée en minutes
 * 
 * @example
 * calculateDuration("09:00", "10:30") // 90
 */
export function calculateDuration(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime)
}

