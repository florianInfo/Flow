import { PlannedActivity } from '../models/Planning'

/**
 * Position et largeur d'une activité pour éviter les chevauchements
 */
export interface ActivityPosition {
  left: number
  width: number
}

/**
 * Vérifie si deux activités se chevauchent dans le temps
 * 
 * @param start1 - Heure de début de la première activité en minutes
 * @param end1 - Heure de fin de la première activité en minutes
 * @param start2 - Heure de début de la deuxième activité en minutes
 * @param end2 - Heure de fin de la deuxième activité en minutes
 * @returns true si les activités se chevauchent
 * 
 * @example
 * activitiesOverlap(540, 600, 570, 630) // true (chevauchement)
 * activitiesOverlap(540, 600, 600, 660) // false (pas de chevauchement)
 */
export function activitiesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && end1 > start2
}

/**
 * Détecte les activités qui se chevauchent et calcule leurs positions pour les répartir horizontalement
 * 
 * @param plannedActivities - Liste des activités planifiées
 * @param day - Jour pour lequel calculer les chevauchements
 * @param timeToMinutes - Fonction pour convertir HH:mm en minutes
 * @returns Map avec l'ID de l'activité comme clé et sa position (left, width) comme valeur
 * 
 * @example
 * const positions = getOverlappingActivities(plannedActivities, new Date(), timeToMinutes)
 * const pos = positions.get(activityId) // { left: 0, width: 100 } ou { left: 50, width: 50 }
 */
export function getOverlappingActivities(
  plannedActivities: PlannedActivity[],
  day: Date,
  timeToMinutes: (time: string) => number
): Map<number, ActivityPosition> {
  const dateStr = day.toISOString().split('T')[0]
  const dayActivities = plannedActivities.filter(p => p.date === dateStr)

  // Trier par heure de début
  const sorted = [...dayActivities].sort((a, b) =>
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  )

  // Grouper les activités qui se chevauchent
  const groups: PlannedActivity[][] = []

  sorted.forEach(activity => {
    const start = timeToMinutes(activity.startTime)
    const end = timeToMinutes(activity.endTime)

    // Trouver un groupe où cette activité chevauche
    let addedToGroup = false
    for (const group of groups) {
      // Vérifier si l'activité chevauche avec au moins une activité du groupe
      const overlaps = group.some(groupActivity => {
        const groupStart = timeToMinutes(groupActivity.startTime)
        const groupEnd = timeToMinutes(groupActivity.endTime)
        return activitiesOverlap(start, end, groupStart, groupEnd)
      })

      if (overlaps) {
        group.push(activity)
        addedToGroup = true
        break
      }
    }

    // Si aucune chevauchement, créer un nouveau groupe
    if (!addedToGroup) {
      groups.push([activity])
    }
  })

  // Calculer la position et largeur pour chaque activité dans chaque groupe
  const activityPositions = new Map<number, ActivityPosition>()

  groups.forEach(group => {
    if (group.length === 1) {
      // Une seule activité, prend toute la largeur
      activityPositions.set(group[0].id || 0, { left: 0, width: 100 })
    } else {
      // Plusieurs activités, les répartir horizontalement
      const width = 100 / group.length
      group.forEach((activity, index) => {
        activityPositions.set(activity.id || 0, {
          left: index * width,
          width: width
        })
      })
    }
  })

  return activityPositions
}

