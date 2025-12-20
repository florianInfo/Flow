import { ScheduledActivity, PlannedActivity } from '../models/Planning'

/**
 * Génère les plannedActivities basées sur la périodicité des scheduledActivities
 * @param scheduledActivities Les activités planifiées avec leur périodicité
 * @param startDate Date de début pour la génération (début de la semaine actuelle)
 * @param endDate Date de fin pour la génération (fin de la semaine actuelle + quelques semaines)
 * @returns Un tableau de PlannedActivity générées
 */
export function generatePlannedActivities(
  scheduledActivities: ScheduledActivity[],
  startDate: Date = new Date(),
  endDate: Date = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 jours par défaut
): PlannedActivity[] {
  const plannedActivities: PlannedActivity[] = []
  
  scheduledActivities.forEach(scheduled => {
    if (!scheduled.periodicity) {
      // Si pas de périodicité, on génère uniquement pour le jour de la semaine spécifié
      if (scheduled.dayOfWeek !== undefined) {
        const activities = generateForDayOfWeek(scheduled, startDate, endDate)
        plannedActivities.push(...activities)
      }
      return
    }

    const { frequency, unit } = scheduled.periodicity
    
    // Calculer les dates selon la périodicité
    let currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()
      
      // Vérifier si cette date correspond à la fréquence
      let shouldGenerate = false
      
      switch (unit) {
        case 'daily':
          // Pour daily, on génère tous les jours selon la fréquence (on ignore dayOfWeek)
          const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
          shouldGenerate = daysSinceStart % frequency === 0
          break
          
        case 'weekly':
          // Pour weekly, on génère toutes les X semaines
          // Si dayOfWeek est défini, on génère uniquement pour ce jour de la semaine
          if (scheduled.dayOfWeek !== undefined && scheduled.dayOfWeek !== dayOfWeek) {
            currentDate.setDate(currentDate.getDate() + 1)
            continue
          }
          const weeksSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
          shouldGenerate = weeksSinceStart % frequency === 0
          break
          
        case 'monthly':
          // Pour monthly, on génère tous les X mois
          // Si dayOfWeek est défini, on génère pour le premier jour de ce type dans chaque mois (ex: premier lundi)
          // Sinon, on génère pour le même jour du mois (ex: le 15 de chaque mois)
          
          if (scheduled.dayOfWeek !== undefined) {
            // Si dayOfWeek est défini, on génère uniquement pour le premier jour de ce type dans le mois
            if (scheduled.dayOfWeek !== dayOfWeek) {
              currentDate.setDate(currentDate.getDate() + 1)
              continue
            }
            // Vérifier que c'est bien le premier jour de ce type dans le mois
            const dayOfMonth = currentDate.getDate()
            const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
            const firstDayOfWeek = firstDayOfMonth.getDay()
            // Calculer le jour du mois du premier jour de la semaine correspondant
            // Si le 1er est déjà le bon jour, c'est le 1er
            // Sinon, on calcule combien de jours ajouter
            let firstOccurrenceDay: number
            if (firstDayOfWeek === scheduled.dayOfWeek) {
              firstOccurrenceDay = 1
            } else {
              const daysToAdd = (scheduled.dayOfWeek - firstDayOfWeek + 7) % 7
              firstOccurrenceDay = daysToAdd + 1
            }
            if (dayOfMonth !== firstOccurrenceDay) {
              currentDate.setDate(currentDate.getDate() + 1)
              continue
            }
          } else {
            // Si dayOfWeek n'est pas défini, on génère pour le même jour du mois
            const startDayOfMonth = startDate.getDate()
            if (currentDate.getDate() !== startDayOfMonth) {
              currentDate.setDate(currentDate.getDate() + 1)
              continue
            }
          }
          
          // Calculer le nombre de mois depuis le début
          const monthsSinceStart = 
            (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
            (currentDate.getMonth() - startDate.getMonth())
          // Générer uniquement si on est dans un mois qui correspond à la fréquence
          shouldGenerate = monthsSinceStart >= 0 && monthsSinceStart % frequency === 0
          break
      }
      
      if (shouldGenerate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const planned: PlannedActivity = {
          activityId: scheduled.activityId,
          scheduledActivityId: scheduled.id,
          date: dateStr,
          startTime: scheduled.startTime,
          endTime: scheduled.endTime,
        }
        plannedActivities.push(planned)
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
  })
  
  return plannedActivities
}

/**
 * Génère des plannedActivities pour un jour de la semaine spécifique
 */
function generateForDayOfWeek(
  scheduled: ScheduledActivity,
  startDate: Date,
  endDate: Date
): PlannedActivity[] {
  const plannedActivities: PlannedActivity[] = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    if (currentDate.getDay() === scheduled.dayOfWeek) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const planned: PlannedActivity = {
        activityId: scheduled.activityId,
        scheduledActivityId: scheduled.id,
        date: dateStr,
        startTime: scheduled.startTime,
        endTime: scheduled.endTime,
      }
      plannedActivities.push(planned)
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return plannedActivities
}
