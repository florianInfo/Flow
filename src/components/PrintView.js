import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './PrintView.css';

const PrintView = ({ schedule, activities }) => {
  // Générer les créneaux horaires pour l'impression
  const timeSlots = [];
  for (let hour = 6; hour <= 22; hour++) {
    timeSlots.push({
      id: `${hour}:00`,
      label: `${hour}:00`,
      hour: hour
    });
  }

  // Jours de la semaine
  const days = [
    { id: 'monday', label: 'LUNDI', short: 'LUN' },
    { id: 'tuesday', label: 'MARDI', short: 'MAR' },
    { id: 'wednesday', label: 'MERCREDI', short: 'MER' },
    { id: 'thursday', label: 'JEUDI', short: 'JEU' },
    { id: 'friday', label: 'VENDREDI', short: 'VEN' },
    { id: 'saturday', label: 'SAMEDI', short: 'SAM' },
    { id: 'sunday', label: 'DIMANCHE', short: 'DIM' }
  ];

  // Obtenir la semaine actuelle
  const getCurrentWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lundi
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    
    return weekDates;
  };

  const weekDates = getCurrentWeek();

  // Calculer les statistiques pour l'impression
  const getPrintStatistics = () => {
    const stats = {};
    let totalTime = 0;
    let totalSessions = 0;

    Object.values(schedule).forEach(daySchedule => {
      Object.values(daySchedule || {}).forEach(activity => {
        if (activity && activity.id) {
          if (!stats[activity.id]) {
            stats[activity.id] = {
              title: activity.title,
              color: activity.color,
              totalMinutes: 0,
              sessions: 0
            };
          }
          
          stats[activity.id].totalMinutes += activity.duration || 0;
          stats[activity.id].sessions += 1;
          totalTime += activity.duration || 0;
          totalSessions += 1;
        }
      });
    });

    return { stats, totalTime, totalSessions };
  };

  const { stats, totalTime, totalSessions } = getPrintStatistics();
  const ranking = Object.values(stats)
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 5); // Top 5

  return (
    <div className="print-view">
      {/* En-tête d'impression */}
      <div className="print-header">
        <div className="print-title">
          <h1>🌿 Zen Weekly Planner</h1>
          <p>Planning de la semaine du {format(weekDates[0], 'dd MMMM yyyy', { locale: fr })} au {format(weekDates[6], 'dd MMMM yyyy', { locale: fr })}</p>
        </div>
        <div className="print-date">
          Imprimé le {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}
        </div>
      </div>

      {/* Planning principal */}
      <div className="print-planning">
        <div className="print-grid">
          {/* En-tête des jours */}
          <div className="print-days-header">
            <div className="print-time-column"></div>
            {days.map((day, index) => (
              <div key={day.id} className="print-day-header">
                <div className="day-name">{day.label}</div>
                <div className="day-date">{format(weekDates[index], 'dd/MM', { locale: fr })}</div>
              </div>
            ))}
          </div>

          {/* Grille des créneaux */}
          {timeSlots.map(timeSlot => (
            <div key={timeSlot.id} className="print-time-row">
              <div className="print-time-label">
                {timeSlot.label}
              </div>
              
              {days.map(day => {
                const activity = schedule[day.id]?.[timeSlot.id];
                return (
                  <div key={`${day.id}-${timeSlot.id}`} className="print-time-cell">
                    {activity && (
                      <div 
                        className="print-activity"
                        style={{ backgroundColor: activity.color }}
                      >
                        <div className="print-activity-title">{activity.title}</div>
                        <div className="print-activity-duration">{activity.duration}min</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Statistiques d'impression */}
      <div className="print-statistics">
        <h2>📊 Statistiques de la semaine</h2>
        
        <div className="print-stats-grid">
          <div className="print-stat-item">
            <div className="stat-label">Temps total planifié</div>
            <div className="stat-value">
              {Math.floor(totalTime / 60)}h{totalTime % 60 > 0 ? (totalTime % 60).toString().padStart(2, '0') : ''}
            </div>
          </div>
          
          <div className="print-stat-item">
            <div className="stat-label">Nombre de sessions</div>
            <div className="stat-value">{totalSessions}</div>
          </div>
          
          <div className="print-stat-item">
            <div className="stat-label">Activités différentes</div>
            <div className="stat-value">{Object.keys(stats).length}</div>
          </div>
        </div>

        {/* Top 5 des activités */}
        {ranking.length > 0 && (
          <div className="print-ranking">
            <h3>🏆 Top 5 des activités</h3>
            <div className="print-ranking-list">
              {ranking.map((activity, index) => (
                <div key={activity.title} className="print-ranking-item">
                  <div className="ranking-position">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </div>
                  <div 
                    className="ranking-color"
                    style={{ backgroundColor: activity.color }}
                  ></div>
                  <div className="ranking-info">
                    <div className="ranking-title">{activity.title}</div>
                    <div className="ranking-time">
                      {Math.floor(activity.totalMinutes / 60)}h{activity.totalMinutes % 60 > 0 ? (activity.totalMinutes % 60).toString().padStart(2, '0') : ''} 
                      ({activity.sessions} session{activity.sessions > 1 ? 's' : ''})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Légende des couleurs */}
      <div className="print-legend">
        <h3>🎨 Légende des couleurs</h3>
        <div className="print-legend-items">
          <div className="print-legend-item">
            <div className="legend-color" style={{ backgroundColor: '#8BA888' }}></div>
            <span>Nature / Calme / Repos</span>
          </div>
          <div className="print-legend-item">
            <div className="legend-color" style={{ backgroundColor: '#7B8654' }}></div>
            <span>Concentration / Travail</span>
          </div>
          <div className="print-legend-item">
            <div className="legend-color" style={{ backgroundColor: '#DCA44C' }}></div>
            <span>Énergie / Sport / Motivation</span>
          </div>
          <div className="print-legend-item">
            <div className="legend-color" style={{ backgroundColor: '#C1683C' }}></div>
            <span>Passion / Créativité</span>
          </div>
          <div className="print-legend-item">
            <div className="legend-color" style={{ backgroundColor: '#4B7B73' }}></div>
            <span>Méditation / Détente / Soirée</span>
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="print-footer">
        <p>Créé avec Zen Weekly Planner - Application de planification zen</p>
        <p>Charte graphique inspirée de la nature et des tons bois/forêt</p>
      </div>
    </div>
  );
};

export default PrintView;
