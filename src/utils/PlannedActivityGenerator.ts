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
          // Si dayOfWeek est défini, on génère pour le jour de la semaine correspondant à la semaine du mois spécifiée
          // Sinon, on génère pour le même jour du mois (ex: le 15 de chaque mois)
          
          if (scheduled.dayOfWeek !== undefined) {
            // Si dayOfWeek est défini, on génère uniquement pour ce jour de la semaine
            if (scheduled.dayOfWeek !== dayOfWeek) {
              currentDate.setDate(currentDate.getDate() + 1)
              continue
            }
            
            // Calculer la semaine du mois souhaitée (1-4 ou -1 pour dernière)
            const weekOfMonth = scheduled.periodicity?.weekOfMonth || 1
            
            // Calculer dans quelle semaine du mois on se trouve
            const dayOfMonth = currentDate.getDate()
            const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
            
            let currentWeekOfMonth: number
            if (weekOfMonth === -1) {
              // Dernière semaine : vérifier si on est dans les 7 derniers jours
              const lastWeekStart = lastDayOfMonth - 6
              if (dayOfMonth >= lastWeekStart) {
                currentWeekOfMonth = -1
              } else {
                currentWeekOfMonth = Math.ceil(dayOfMonth / 7)
              }
            } else {
              // Semaine normale (1-4)
              currentWeekOfMonth = Math.ceil(dayOfMonth / 7)
            }
            
            // Vérifier que c'est bien la bonne semaine du mois
            if (currentWeekOfMonth !== weekOfMonth) {
              currentDate.setDate(currentDate.getDate() + 1)
              continue
            }
            
            // Vérifier que c'est bien le jour de la semaine correspondant dans cette semaine du mois
            const weekStartDay = (weekOfMonth === -1) 
              ? Math.max(1, lastDayOfMonth - 6)
              : ((weekOfMonth - 1) * 7) + 1
            const weekEndDay = (weekOfMonth === -1)
              ? lastDayOfMonth
              : Math.min(weekOfMonth * 7, lastDayOfMonth)
            
            // Trouver le jour de la semaine correspondant dans cette plage
            let targetDay: number | null = null
            for (let d = weekStartDay; d <= weekEndDay; d++) {
              const testDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d)
              if (testDate.getDay() === scheduled.dayOfWeek) {
                targetDay = d
                break
              }
            }
            
            // Si on n'a pas trouvé de jour correspondant dans cette semaine, passer au jour suivant
            if (targetDay === null || dayOfMonth !== targetDay) {
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
