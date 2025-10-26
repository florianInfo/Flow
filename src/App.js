import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Planner } from './models/DataModels';
import { PlannerProvider } from './context/PlannerContext';
import Header from './components/Header';
import PlannerGrid from './components/PlannerGrid';
import ActivityCreator from './components/ActivityCreator';
import ActivityModal from './components/ActivityModal';
import StatisticsPanel from './components/StatisticsPanel';
import NotificationSystem from './components/NotificationSystem';
import PrintView from './components/PrintView';
import { useLocalStorage } from './hooks/useLocalStorage';

function App() {
  const [planner, setPlanner] = useLocalStorage('flow-planner', new Planner());
  const [notifications, setNotifications] = useState([]);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  // Sauvegarder automatiquement les changements
  useEffect(() => {
    const saveData = () => {
      localStorage.setItem('flow-planner-data', JSON.stringify(planner.toJSON()));
    };
    
    const timeoutId = setTimeout(saveData, 1000); // Debounce de 1 seconde
    return () => clearTimeout(timeoutId);
  }, [planner]);

  const addNotification = (message, type = 'positive') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleActivityCreated = (activity) => {
    setPlanner(prev => {
      const newPlanner = new Planner();
      Object.assign(newPlanner, prev);
      
      if (editingActivity) {
        // Mode édition : mettre à jour l'activité existante
        const activityIndex = newPlanner.activities.findIndex(a => a.id === activity.id);
        if (activityIndex !== -1) {
          newPlanner.activities[activityIndex] = activity;
        }
        addNotification(`Activité "${activity.title}" modifiée !`, 'positive');
      } else {
        // Mode création : ajouter une nouvelle activité
        newPlanner.addActivity(activity);
        addNotification(`Activité "${activity.title}" créée !`, 'positive');
      }
      
      return newPlanner;
    });
  };

  const contextValue = {
    planner,
    setPlanner,
    addNotification,
    openActivityModal: () => {
      setEditingActivity(null);
      setIsActivityModalOpen(true);
    },
    editActivity: (activity) => {
      console.log('editActivity called with:', activity);
      setEditingActivity(activity);
      setIsActivityModalOpen(true);
    }
  };

  return (
    <PlannerProvider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-wood-50 to-wood-100 cursor-default select-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col h-screen"
        >
          {/* Header avec logo et menu */}
          <Header />
          
          {/* Zone principale avec créateur d'activités et planner */}
          <div className="flex-1 flex flex-col overflow-y-scroll">
            {/* Créateur d'activités */}
            <ActivityCreator />
            
            {/* Planner principal */}
            <div className="overflow-y-scroll">
              <PlannerGrid />
            </div>
          </div>
          
          {/* Panel de statistiques en bas */}
          <StatisticsPanel />
        </motion.div>
        
        {/* Système de notifications */}
        <NotificationSystem notifications={notifications} />
        
        {/* Modal de création d'activité */}
        <ActivityModal 
          isOpen={isActivityModalOpen}
          onClose={() => {
            setIsActivityModalOpen(false);
            setEditingActivity(null);
          }}
          onActivityCreated={handleActivityCreated}
          editingActivity={editingActivity}
        />
        
        {/* Vue d'impression */}
        <PrintView />
      </div>
    </PlannerProvider>
  );
}

export default App;
