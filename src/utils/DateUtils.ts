/**
 * Calcule le lundi de la semaine pour une date donnée
 * 
 * @param date - Date quelconque
 * @returns Date du lundi de la semaine
 * 
 * @example
 * getWeekStart(new Date(2024, 0, 15)) // Date du lundi 8 janvier 2024
 */
export function getWeekStart(date: Date): Date {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Ajuster pour lundi
  return new Date(start.setDate(diff))
}

/**
 * Génère un tableau des 7 jours de la semaine à partir d'un lundi
 * 
 * @param weekStart - Date du lundi de la semaine
 * @returns Tableau de 7 dates (lundi à dimanche)
 * 
 * @example
 * const monday = getWeekStart(new Date())
 * generateWeekDays(monday) // [lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche]
 */
export function generateWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    return date
  })
}

/**
 * Génère les jours de la semaine pour le mode routine (dates fictives)
 * Utilise le lundi de la semaine courante comme référence mais les dates sont fictives
 * 
 * @returns Tableau de 7 dates fictives (lundi à dimanche)
 */
export function generateRoutineWeekDays(): Date[] {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Ajuster pour lundi
  const monday = new Date(today.setDate(diff))
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(date.getDate() + i)
    return date
  })
}

