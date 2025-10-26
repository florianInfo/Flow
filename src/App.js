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
import './styles/wooden-board.css';

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

  const handleActivityDeleted = (activity) => {
    setPlanner(prev => {
      const newPlanner = new Planner();
      Object.assign(newPlanner, prev);
      
      // Supprimer l'activité
      newPlanner.activities = newPlanner.activities.filter(a => a.id !== activity.id);
      
      // Supprimer aussi toutes les activités programmées liées à cette activité
      newPlanner.scheduledActivities = newPlanner.scheduledActivities.filter(sa => sa.activityId !== activity.id);
      
      addNotification(`Activité "${activity.title}" supprimée !`, 'positive');
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
    },
    deleteActivity: (activity) => {
      console.log('deleteActivity called with:', activity);
      handleActivityDeleted(activity);
    }
  };

  return (
    <PlannerProvider value={contextValue}>
      <div className="min-h-screen cursor-default select-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col h-screen wooden-board rounded-2xl overflow-hidden relative"
        >
          {/* Titre Flow inscrit au fer chaud */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
            <h1 className="burned-title text-3xl">Flow</h1>
          </div>
          
          {/* Classement inscrit au fer chaud */}
          <div className="absolute top-4 right-8 z-30">
            <div className="burned-text text-sm">Classement</div>
            <div className="burned-text text-xs mt-1">#1 Productif</div>
          </div>
          
          {/* Clous décoratifs */}
          <div className="wooden-nail" style={{ top: '20px', left: '20px' }}></div>
          <div className="wooden-nail" style={{ top: '20px', right: '20px' }}></div>
          <div className="wooden-nail" style={{ bottom: '20px', left: '20px' }}></div>
          <div className="wooden-nail" style={{ bottom: '20px', right: '20px' }}></div>
          
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
