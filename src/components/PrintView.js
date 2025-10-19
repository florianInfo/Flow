import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import { DAYS, TIME_SLOTS } from '../models/DataModels';

const PrintView = () => {
  const { planner } = usePlanner();

  const getScheduledActivitiesForSlot = (day, time) => {
    const creneaux = planner.creneaux.find(c => c.day === day && c.startTime === time);
    if (!creneaux) return [];

    return planner.scheduledActivities
      .filter(sa => sa.creneauxId === creneaux.id)
      .map(sa => {
        const activity = planner.activities.find(a => a.id === sa.activityId);
        return { ...sa, activity };
      })
      .filter(sa => sa.activity);
  };

  const getActivityColorClass = (color) => {
    const colorMap = {
      'sage': 'color-sage',
      'moss': 'color-moss', 
      'gold': 'color-gold',
      'copper': 'color-copper',
      'teal': 'color-teal'
    };
    return colorMap[color] || 'color-sage';
  };

  return (
    <div className="print-view hidden">
      {/* Header d'impression */}
      <div className="print-header">
        <h1>Flow Planner - Planning de la Semaine</h1>
        <p>Généré le {new Date().toLocaleDateString('fr-FR')}</p>
      </div>

      {/* Grille du planning */}
      <table className="planner-grid w-full">
        <thead>
          <tr>
            <th className="time-header">Heures</th>
            {DAYS.map(day => (
              <th key={day} className="time-header">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map(time => (
            <tr key={time}>
              <td className="time-slot text-center font-medium">{time}</td>
              {DAYS.map((day, dayIndex) => (
                <td key={`${day}-${time}`} className="time-slot">
                  {getScheduledActivitiesForSlot(dayIndex, time).map((scheduledActivity) => (
                    <div
                      key={scheduledActivity.id}
                      className={`activity-block ${getActivityColorClass(scheduledActivity.activity.color)}`}
                    >
                      <span className="activity-title">{scheduledActivity.activity.title}</span>
                      <span className="activity-time">
                        {time} - {scheduledActivity.creneaux?.endTime || time}
                      </span>
                    </div>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Statistiques */}
      <div className="print-stats">
        <h2>Classement des Activités</h2>
        <div className="space-y-2">
          {planner.getActivityStats().slice(0, 10).map((stat, index) => (
            <div key={stat.activity.id} className="ranking-item">
              <div className="flex items-center space-x-2">
                <span className="font-bold">#{index + 1}</span>
                <div
                  className={`w-4 h-4 rounded ${getActivityColorClass(stat.activity.color)}`}
                />
                <span className="font-medium">{stat.activity.title}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {Math.floor(stat.totalMinutes / 60)}h {stat.totalMinutes % 60}min
                </div>
                <div className="text-sm text-gray-600">
                  {stat.scheduledCount} session{stat.scheduledCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrintView;
