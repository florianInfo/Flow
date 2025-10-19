import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, Clock } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { Creneaux, Planner } from '../models/DataModels';
import ActivityBlock from './ActivityBlock';

const ResizableActivity = ({ scheduledActivity, day, time }) => {
  const { planner, setPlanner, addNotification } = usePlanner();
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [startY, setStartY] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  const activityRef = useRef(null);

  const activity = planner.activities.find(a => a.id === scheduledActivity.activityId);
  const creneaux = planner.creneaux.find(c => c.id === scheduledActivity.creneauxId);

  const getDurationInMinutes = () => {
    const start = creneaux.parseTime(creneaux.startTime);
    const end = creneaux.parseTime(creneaux.endTime);
    return (end - start) / (1000 * 60);
  };

  const getHeightFromDuration = (minutes) => {
    // 60px par heure, donc 1px par minute
    return Math.max(15, minutes); // Minimum 15px (15 minutes)
  };

  const handleMouseDown = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
    setStartY(e.clientY);
    setInitialHeight(getDurationInMinutes());
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;

    const deltaY = e.clientY - startY;
    const pixelsPerMinute = 1; // 1px = 1 minute
    const deltaMinutes = deltaY * pixelsPerMinute;
    
    let newDuration = initialHeight;
    if (resizeDirection === 'bottom') {
      newDuration = initialHeight + deltaMinutes;
    } else if (resizeDirection === 'top') {
      newDuration = initialHeight - deltaMinutes;
    }

    // Limites : minimum 15 minutes, maximum 24 heures (1440 minutes)
    newDuration = Math.max(15, Math.min(1440, newDuration));
    
    // Mettre à jour visuellement
    if (activityRef.current) {
      activityRef.current.style.height = `${newDuration}px`;
    }
  };

  const handleMouseUp = () => {
    if (!isResizing) return;

    const finalHeight = activityRef.current?.style.height;
    if (finalHeight) {
      const newDuration = parseInt(finalHeight);
      updateActivityDuration(newDuration);
    }

    setIsResizing(false);
    setResizeDirection(null);
  };

  const updateActivityDuration = (newDurationMinutes) => {
    const startTime = creneaux.parseTime(creneaux.startTime);
    const newEndTime = new Date(startTime.getTime() + newDurationMinutes * 60000);
    
    const newEndTimeString = `${newEndTime.getHours().toString().padStart(2, '0')}:${newEndTime.getMinutes().toString().padStart(2, '0')}`;
    
    setPlanner(prev => {
      const newPlanner = new Planner();
      Object.assign(newPlanner, prev);
      
      // Mettre à jour le créneau
      const updatedCreneaux = newPlanner.creneaux.find(c => c.id === creneaux.id);
      if (updatedCreneaux) {
        updatedCreneaux.endTime = newEndTimeString;
      }
      
      newPlanner.updateLastModified();
      return newPlanner;
    });

    addNotification(`Durée mise à jour: ${Math.floor(newDurationMinutes / 60)}h ${newDurationMinutes % 60}min`, 'positive');
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, startY, initialHeight, resizeDirection]);

  // Vérification après tous les hooks
  if (!activity || !creneaux) return null;

  const duration = getDurationInMinutes();
  const height = getHeightFromDuration(duration);

  return (
    <motion.div
      ref={activityRef}
      className="relative group"
      style={{ height: `${height}px` }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="h-full relative">
        <ActivityBlock
          activity={activity}
          className="h-full flex flex-col justify-between"
        />
        
        {/* Indicateur de durée */}
        <div className="absolute top-1 right-1 bg-black/20 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          <Clock className="w-3 h-3 inline mr-1" />
          {Math.floor(duration / 60)}h {duration % 60}min
        </div>
        
        {/* Poignées de redimensionnement */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Poignée du haut */}
          <div
            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-wood-400 rounded cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
            onMouseDown={(e) => handleMouseDown(e, 'top')}
          >
            <GripVertical className="w-4 h-4 text-white mx-auto" />
          </div>
          
          {/* Poignée du bas */}
          <div
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-wood-400 rounded cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
            onMouseDown={(e) => handleMouseDown(e, 'bottom')}
          >
            <GripVertical className="w-4 h-4 text-white mx-auto" />
          </div>
        </div>
        
        {/* Indicateur de redimensionnement */}
        {isResizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg bg-black/10"
          />
        )}
      </div>
    </motion.div>
  );
};

export default ResizableActivity;
