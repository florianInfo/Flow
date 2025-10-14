import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './StatisticsPanel.css';

const StatisticsPanel = ({ statistics, activities, schedule, onStatisticsChange }) => {
  const [currentStats, setCurrentStats] = useState({});
  const [previousStats, setPreviousStats] = useState({});
  const [notifications, setNotifications] = useState([]);

  // Calculer les statistiques en temps réel
  useEffect(() => {
    const newStats = calculateStatistics();
    
    // Détecter les changements et créer des notifications
    if (Object.keys(currentStats).length > 0) {
      detectChanges(currentStats, newStats);
    }
    
    setPreviousStats(currentStats);
    setCurrentStats(newStats);
    onStatisticsChange(newStats);
  }, [schedule, activities]);

  // Calculer les statistiques
  const calculateStatistics = () => {
    const stats = {};
    const totalTime = {};

    // Parcourir le planning pour calculer le temps par activité
    Object.values(schedule).forEach(daySchedule => {
      Object.values(daySchedule || {}).forEach(activity => {
        if (activity && activity.id) {
          const activityId = activity.id;
          const duration = activity.duration || 0;
          
          if (!totalTime[activityId]) {
            totalTime[activityId] = {
              id: activityId,
              title: activity.title,
              color: activity.color,
              totalMinutes: 0,
              sessions: 0,
              lastActivity: new Date()
            };
          }
          
          totalTime[activityId].totalMinutes += duration;
          totalTime[activityId].sessions += 1;
          totalTime[activityId].lastActivity = new Date();
        }
      });
    });

    // Convertir en heures et minutes
    Object.values(totalTime).forEach(activity => {
      const hours = Math.floor(activity.totalMinutes / 60);
      const minutes = activity.totalMinutes % 60;
      
      stats[activity.id] = {
        ...activity,
        hours,
        minutes,
        displayTime: `${hours}h${minutes > 0 ? minutes.toString().padStart(2, '0') : ''}`,
        totalMinutes: activity.totalMinutes
      };
    });

    return stats;
  };

  // Détecter les changements et créer des notifications
  const detectChanges = (oldStats, newStats) => {
    Object.keys(newStats).forEach(activityId => {
      const oldActivity = oldStats[activityId];
      const newActivity = newStats[activityId];
      
      if (oldActivity) {
        const timeDiff = newActivity.totalMinutes - oldActivity.totalMinutes;
        if (timeDiff > 0) {
          addNotification(`${newActivity.title}: +${timeDiff}min`, 'success', newActivity.color);
        }
      }
    });

    // Détecter les changements de position dans le classement
    const oldRanking = getRanking(oldStats);
    const newRanking = getRanking(newStats);
    
    newRanking.forEach((activity, index) => {
      const oldIndex = oldRanking.findIndex(a => a.id === activity.id);
      if (oldIndex !== -1 && oldIndex !== index) {
        const positionChange = oldIndex - index;
        const direction = positionChange > 0 ? '↑' : '↓';
        addNotification(
          `${activity.title} ${direction}${Math.abs(positionChange)} position${Math.abs(positionChange) > 1 ? 's' : ''}`,
          'info',
          activity.color
        );
      }
    });
  };

  // Obtenir le classement des activités
  const getRanking = (stats) => {
    return Object.values(stats)
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .map((activity, index) => ({ ...activity, position: index + 1 }));
  };

  // Ajouter une notification
  const addNotification = (message, type, color) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      color,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Supprimer la notification après 4 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 4000);
  };

  // Supprimer une notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const ranking = getRanking(currentStats);

  return (
    <div className="statistics-panel">
      <div className="stats-header">
        <h3>📊 Statistiques Temps Réel</h3>
        <div className="stats-subtitle">Classement F1 des activités</div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            className="stat-notification"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{ borderLeftColor: notification.color }}
          >
            <div className="notification-content">
              <span className="notification-message">{notification.message}</span>
              <button
                className="notification-close"
                onClick={() => removeNotification(notification.id)}
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Classement */}
      <div className="ranking-container">
        <div className="ranking-header">
          <span>Position</span>
          <span>Activité</span>
          <span>Temps</span>
          <span>Sessions</span>
        </div>

        <div className="ranking-list">
          <AnimatePresence>
            {ranking.map((activity, index) => (
              <motion.div
                key={activity.id}
                className={`ranking-item ${index < 3 ? 'podium' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                style={{ borderLeftColor: activity.color }}
              >
                <div className="position">
                  {index < 3 ? (
                    <span className="podium-icon">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="position-number">{index + 1}</span>
                  )}
                </div>
                
                <div className="activity-info">
                  <div 
                    className="activity-color"
                    style={{ backgroundColor: activity.color }}
                  ></div>
                  <span className="activity-title">{activity.title}</span>
                </div>
                
                <div className="time-info">
                  <span className="time-display">{activity.displayTime}</span>
                  <span className="time-detail">
                    {activity.totalMinutes}min
                  </span>
                </div>
                
                <div className="sessions-info">
                  <span className="sessions-count">{activity.sessions}</span>
                  <span className="sessions-label">session{activity.sessions > 1 ? 's' : ''}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Résumé global */}
      <div className="summary-stats">
        <div className="summary-item">
          <div className="summary-label">Total d'activités</div>
          <div className="summary-value">{Object.keys(currentStats).length}</div>
        </div>
        
        <div className="summary-item">
          <div className="summary-label">Temps total</div>
          <div className="summary-value">
            {Math.floor(Object.values(currentStats).reduce((sum, activity) => sum + activity.totalMinutes, 0) / 60)}h
            {Object.values(currentStats).reduce((sum, activity) => sum + activity.totalMinutes, 0) % 60}min
          </div>
        </div>
        
        <div className="summary-item">
          <div className="summary-label">Sessions totales</div>
          <div className="summary-value">
            {Object.values(currentStats).reduce((sum, activity) => sum + activity.sessions, 0)}
          </div>
        </div>
      </div>

      {Object.keys(currentStats).length === 0 && (
        <div className="empty-stats">
          <div className="empty-icon">📊</div>
          <p>Aucune activité planifiée</p>
          <small>Ajoutez des activités à votre planning pour voir les statistiques</small>
        </div>
      )}
    </div>
  );
};

export default StatisticsPanel;
