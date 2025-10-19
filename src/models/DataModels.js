// Modèles de données pour l'application Flow Planner

export class Activity {
  constructor(id, title, color, description = '') {
    this.id = id;
    this.title = title;
    this.color = color;
    this.description = description;
    this.createdAt = new Date().toISOString();
  }
}

export class Creneaux {
  constructor(id, day, startTime, endTime) {
    this.id = id;
    this.day = day; // 0 = Lundi, 6 = Dimanche
    this.startTime = startTime; // Format "HH:MM"
    this.endTime = endTime; // Format "HH:MM"
  }
  
  getDuration() {
    const start = this.parseTime(this.startTime);
    const end = this.parseTime(this.endTime);
    return (end - start) / (1000 * 60); // Durée en minutes
  }
  
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  
  isValid() {
    const start = this.parseTime(this.startTime);
    const end = this.parseTime(this.endTime);
    return end > start;
  }
}

export class ScheduledActivity {
  constructor(id, activityId, creneauxId, notes = '') {
    this.id = id;
    this.activityId = activityId;
    this.creneauxId = creneauxId;
    this.notes = notes;
    this.createdAt = new Date().toISOString();
    this.completed = false;
  }
}

export class Planner {
  constructor() {
    this.id = 'main-planner';
    this.activities = [];
    this.creneaux = [];
    this.scheduledActivities = [];
    this.createdAt = new Date().toISOString();
    this.lastModified = new Date().toISOString();
  }
  
  addActivity(activity) {
    this.activities.push(activity);
    this.updateLastModified();
  }
  
  removeActivity(activityId) {
    this.activities = this.activities.filter(a => a.id !== activityId);
    // Supprimer aussi les activités programmées associées
    this.scheduledActivities = this.scheduledActivities.filter(sa => sa.activityId !== activityId);
    this.updateLastModified();
  }
  
  addCreneaux(creneaux) {
    this.creneaux.push(creneaux);
    this.updateLastModified();
  }
  
  removeCreneaux(creneauxId) {
    this.creneaux = this.creneaux.filter(c => c.id !== creneauxId);
    // Supprimer aussi les activités programmées associées
    this.scheduledActivities = this.scheduledActivities.filter(sa => sa.creneauxId !== creneauxId);
    this.updateLastModified();
  }
  
  scheduleActivity(scheduledActivity) {
    // Vérifier qu'il n'y a pas de conflit
    const creneaux = this.creneaux.find(c => c.id === scheduledActivity.creneauxId);
    if (!creneaux) return false;
    
    const hasConflict = this.scheduledActivities.some(sa => {
      if (sa.id === scheduledActivity.id) return false;
      const existingCreneaux = this.creneaux.find(c => c.id === sa.creneauxId);
      if (!existingCreneaux) return false;
      
      return existingCreneaux.day === creneaux.day &&
             this.timesOverlap(existingCreneaux, creneaux);
    });
    
    if (hasConflict) return false;
    
    this.scheduledActivities.push(scheduledActivity);
    this.updateLastModified();
    return true;
  }
  
  unscheduleActivity(scheduledActivityId) {
    this.scheduledActivities = this.scheduledActivities.filter(sa => sa.id !== scheduledActivityId);
    this.updateLastModified();
  }
  
  timesOverlap(creneaux1, creneaux2) {
    const start1 = creneaux1.parseTime(creneaux1.startTime);
    const end1 = creneaux1.parseTime(creneaux1.endTime);
    const start2 = creneaux2.parseTime(creneaux2.startTime);
    const end2 = creneaux2.parseTime(creneaux2.endTime);
    
    return start1 < end2 && start2 < end1;
  }
  
  getActivityStats() {
    const stats = {};
    
    this.scheduledActivities.forEach(sa => {
      const activity = this.activities.find(a => a.id === sa.activityId);
      const creneaux = this.creneaux.find(c => c.id === sa.creneauxId);
      
      if (activity && creneaux) {
        if (!stats[activity.id]) {
          stats[activity.id] = {
            activity,
            totalMinutes: 0,
            scheduledCount: 0
          };
        }
        
        stats[activity.id].totalMinutes += creneaux.getDuration();
        stats[activity.id].scheduledCount += 1;
      }
    });
    
    return Object.values(stats).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }
  
  updateLastModified() {
    this.lastModified = new Date().toISOString();
  }
  
  toJSON() {
    return {
      id: this.id,
      activities: this.activities,
      creneaux: this.creneaux,
      scheduledActivities: this.scheduledActivities,
      createdAt: this.createdAt,
      lastModified: this.lastModified
    };
  }
  
  static fromJSON(data) {
    const planner = new Planner();
    planner.id = data.id;
    planner.activities = data.activities || [];
    planner.creneaux = data.creneaux || [];
    planner.scheduledActivities = data.scheduledActivities || [];
    planner.createdAt = data.createdAt;
    planner.lastModified = data.lastModified;
    return planner;
  }
}

// Palette de couleurs
export const COLOR_PALETTE = {
  'sage': { name: 'Sauge', hex: '#8BA888', category: 'Nature / Calme / Repos' },
  'moss': { name: 'Mousse', hex: '#7B8654', category: 'Concentration / Travail' },
  'gold': { name: 'Or', hex: '#DCA44C', category: 'Énergie / Sport / Motivation' },
  'copper': { name: 'Cuivre', hex: '#C1683C', category: 'Passion / Créativité' },
  'teal': { name: 'Sarcelle', hex: '#4B7B73', category: 'Méditation / Détente / Soirée' }
};

// Jours de la semaine
export const DAYS = [
  'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'
];

// Créneaux de 15 minutes de 6h à 23h
export const TIME_SLOTS = Array.from({ length: 68 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 15; // Commence à 6h00, incrémente de 15 min
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});
