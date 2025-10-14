import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { motion } from 'framer-motion';
import './TimeSlot.css';

const TimeSlot = ({ timeSlot, day, schedule, onActivityDrop, onSlotClick }) => {
  const slotId = `${day.id}-${timeSlot.id}`;
  const activity = schedule[day.id]?.[timeSlot.id];

  const handleClick = () => {
    onSlotClick(day.id, timeSlot.id);
  };

  return (
    <Droppable droppableId={slotId}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`time-slot ${snapshot.isDraggingOver ? 'drag-over' : ''} ${activity ? 'has-activity' : ''}`}
          onClick={handleClick}
          whileHover={{ 
            backgroundColor: 'rgba(139, 168, 136, 0.05)',
            scale: 1.01
          }}
          transition={{ duration: 0.2 }}
        >
          {activity && (
            <motion.div
              className="activity-preview"
              style={{ backgroundColor: activity.color }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <span className="activity-title">{activity.title}</span>
              <span className="activity-duration">{activity.duration}min</span>
            </motion.div>
          )}
          
          {provided.placeholder}
          
          {/* Indicateur de drop */}
          {snapshot.isDraggingOver && (
            <motion.div
              className="drop-indicator"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="drop-zone">
                <span>Déposer ici</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </Droppable>
  );
};

export default TimeSlot;
