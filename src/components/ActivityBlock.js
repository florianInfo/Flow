import React, { useState, useRef, useEffect } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { motion } from 'framer-motion';
import './ActivityBlock.css';

const ActivityBlock = ({ activity, onResize, onNotification }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  const blockRef = useRef(null);

  // Calculer la hauteur basée sur la durée
  const getHeight = (duration) => {
    const baseHeight = 60; // Hauteur de base pour 1 heure
    return Math.max(30, (duration / 60) * baseHeight); // Minimum 30px
  };

  // Gérer le début du redimensionnement
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setStartY(e.clientY);
    setInitialHeight(blockRef.current.offsetHeight);
    
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(30, initialHeight + deltaY);
      const newDuration = Math.max(15, Math.round((newHeight / 60) * 60)); // Convertir en minutes
      
      onResize(activity.id, newDuration);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Animation d'apparition
  const blockVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: -10
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 10,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <Draggable draggableId={activity.id} index={0}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`activity-block ${snapshot.isDragging ? 'dragging' : ''}`}
          style={{
            ...provided.draggableProps.style,
            backgroundColor: activity.color,
            height: `${getHeight(activity.duration)}px`,
            minHeight: '30px'
          }}
          variants={blockVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          whileHover={{ 
            scale: 1.02,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="activity-content">
            <div className="activity-title">
              {activity.title}
            </div>
            <div className="activity-duration">
              {activity.duration}min
            </div>
          </div>
          
          {/* Handle de redimensionnement */}
          <div 
            className="resize-handle"
            onMouseDown={handleMouseDown}
            title="Redimensionner l'activité"
          >
            <div className="resize-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>

          {/* Indicateur de durée en temps réel */}
          {isResizing && (
            <motion.div 
              className="duration-indicator"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {activity.duration} minutes
            </motion.div>
          )}
        </motion.div>
      )}
    </Draggable>
  );
};

export default ActivityBlock;
