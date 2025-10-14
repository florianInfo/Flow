import React, { useState, useEffect } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import WeeklyPlanner from './components/WeeklyPlanner';
import ActivityManager from './components/ActivityManager';
import StatisticsPanel from './components/StatisticsPanel';
import NotificationSystem from './components/NotificationSystem';
import AnimatedBackground from './components/AnimatedBackground';
import PrintView from './components/PrintView';
import { loadData, saveData } from './utils/storage';
import './App.css';

function App() {
  const [activities, setActivities] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [statistics, setStatistics] = useState({});
  const [notifications, setNotifications] = useState([]);

  // Charger les données au démarrage
  useEffect(() => {
    const savedData = loadData();
    if (savedData) {
      setActivities(savedData.activities || []);
      setSchedule(savedData.schedule || {});
      setStatistics(savedData.statistics || {});
    }
  }, []);

  // Sauvegarder les données à chaque changement
  useEffect(() => {
    const data = { activities, schedule, statistics };
    saveData(data);
  }, [activities, schedule, statistics]);

  // Gestion du drag & drop
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Logique de déplacement des activités
    const newSchedule = { ...schedule };
    const activity = activities.find(a => a.id === draggableId);
    
    if (activity) {
      const newTimeSlot = destination.droppableId;
      const newDuration = calculateDuration(destination.index);
      
      // Mettre à jour le planning
      newSchedule[newTimeSlot] = {
        ...newSchedule[newTimeSlot],
        [destination.index]: {
          ...activity,
          startTime: newTimeSlot,
          duration: newDuration
        }
      };

      setSchedule(newSchedule);
      
      // Ajouter une notification
      addNotification(`Activité "${activity.title}" déplacée`, 'success');
    }
  };

  // Ajouter une notification
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type, timestamp: new Date() };
    
    setNotifications(prev => [...prev, notification]);
    
    // Supprimer la notification après 3 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Calculer la durée basée sur l'index
  const calculateDuration = (index) => {
    const baseDuration = 15; // 15 minutes minimum
    return baseDuration + (index * 15); // Augmentation par tranches de 15min
  };

  return (
    <div className="app">
      <AnimatedBackground />
      
      <motion.header 
        className="app-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>🌿 Zen Weekly Planner</h1>
        <p>Planifiez votre semaine avec sérénité</p>
      </motion.header>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="app-content">
          <motion.div 
            className="main-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <WeeklyPlanner 
              activities={activities}
              schedule={schedule}
              onScheduleChange={setSchedule}
              onNotification={addNotification}
            />
          </motion.div>

          <motion.div 
            className="side-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <ActivityManager 
              activities={activities}
              onActivitiesChange={setActivities}
              onNotification={addNotification}
            />
            
            <StatisticsPanel 
              statistics={statistics}
              activities={activities}
              schedule={schedule}
              onStatisticsChange={setStatistics}
            />
          </motion.div>
        </div>
      </DragDropContext>

      <NotificationSystem 
        notifications={notifications}
        onRemoveNotification={(id) => 
          setNotifications(prev => prev.filter(n => n.id !== id))
        }
      />

      {/* Vue d'impression cachée */}
      <PrintView 
        schedule={schedule}
        activities={activities}
      />
    </div>
  );
}

export default App;
