/**
 * Dimensions du planner nécessaires pour les calculs de position
 */
export interface PlannerDimensions {
  slotHeight: number
  slotMinutes: number
  startHour: number
  endHour: number
  headerHeight: number
}

/**
 * Position d'un slot horaire
 */
export interface SlotPosition {
  hour: number
  minute: number
}

/**
 * Calcule le slot horaire à partir des coordonnées de la souris
 * 
 * @param mouseY - Position Y de la souris (clientY)
 * @param rect - Rectangle du bounding box du planner
 * @param scrollTop - Position de scroll actuelle
 * @param dimensions - Dimensions du planner
 * @returns Position du slot (hour, minute) ou null si hors limites
 * 
 * @example
 * const slot = getSlotFromMousePosition(
 *   e.clientY,
 *   plannerRef.current.getBoundingClientRect(),
 *   plannerRef.current.scrollTop,
 *   { slotHeight: 60, slotMinutes: 15, startHour: 6, endHour: 22, headerHeight: 48 }
 * )
 */
export function getSlotFromMousePosition(
  mouseY: number,
  rect: DOMRect,
  scrollTop: number,
  dimensions: PlannerDimensions
): SlotPosition | null {
  const { slotHeight, slotMinutes, startHour, endHour, headerHeight } = dimensions

  // Le header sticky a une hauteur définie
  // On soustrait la hauteur du header et on ajoute scrollTop pour obtenir la position absolue dans le contenu scrollé
  const relativeY = mouseY - rect.top - headerHeight + scrollTop

  if (relativeY < 0) return null

  const totalMinutes = (relativeY / slotHeight) * 60
  const hour = Math.floor(totalMinutes / 60) + startHour
  const minute = Math.floor((totalMinutes % 60) / slotMinutes) * slotMinutes

  // Permettre jusqu'à endHour + 1 pour le drag (ex: 23:00 si endHour = 22)
  if (hour < startHour || hour > endHour + 1) return null
  // Limiter à endHour + 1 maximum
  if (hour === endHour + 1 && minute > 0) return null

  return { hour, minute }
}

import { timeToMinutes } from './TimeUtils'

/**
 * Calcule la position top et height d'une activité en pixels
 * 
 * @param startTime - Heure de début au format HH:mm
 * @param endTime - Heure de fin au format HH:mm
 * @param startHour - Heure de début minimale du planner
 * @param slotHeight - Hauteur d'un slot d'une heure en pixels
 * @returns Objet avec top et height en pixels
 * 
 * @example
 * calculateActivityPosition("09:30", "10:15", 6, 60)
 * // { top: 210, height: 45 }
 */
export function calculateActivityPosition(
  startTime: string,
  endTime: string,
  startHour: number,
  slotHeight: number
): { top: number; height: number } {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  const duration = end - start

  // Ajuster la position en soustrayant les heures avant startHour
  const startMinutesFromStart = start - (startHour * 60)
  const top = (startMinutesFromStart / 60) * slotHeight
  const height = (duration / 60) * slotHeight

  return { top, height }
}

/**
 * Détecte si la souris est dans une zone de scroll automatique
 * 
 * @param mouseY - Position Y de la souris relative au viewport
 * @param rectHeight - Hauteur du rectangle du planner
 * @param scrollTop - Position de scroll actuelle
 * @param scrollHeight - Hauteur totale du contenu scrollable
 * @param clientHeight - Hauteur visible du conteneur
 * @param scrollThreshold - Distance en pixels du bord pour déclencher le scroll
 * @returns 'up' si dans la zone supérieure, 'down' si dans la zone inférieure, null sinon
 */
export function detectScrollZone(
  mouseY: number,
  rectHeight: number,
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  scrollThreshold: number
): 'up' | 'down' | null {
  if (mouseY < scrollThreshold && scrollTop > 0) {
    return 'up'
  } else if (mouseY > rectHeight - scrollThreshold) {
    const maxScroll = scrollHeight - clientHeight
    if (scrollTop < maxScroll) {
      return 'down'
    }
  }
  return null
}

/**
 * Valide qu'une durée respecte les contraintes (minimum 15 minutes, maximum jusqu'à endHour)
 * 
 * @param startTime - Heure de début au format HH:mm
 * @param endTime - Heure de fin au format HH:mm
 * @param endHour - Heure de fin maximale
 * @param timeToMinutes - Fonction pour convertir HH:mm en minutes
 * @returns true si la durée est valide
 */
export function validateDuration(
  startTime: string,
  endTime: string,
  endHour: number,
  timeToMinutes: (time: string) => number
): boolean {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  const maxMinutes = (endHour + 1) * 60
  return end > start && end - start >= 15 && end <= maxMinutes
}

