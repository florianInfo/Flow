import React, { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { motion } from 'framer-motion';
import TimeSlot from './TimeSlot';
import ActivityBlock from './ActivityBlock';
import './WeeklyPlanner.css';

const WeeklyPlanner = ({ activities, schedule, onScheduleChange, onNotification }) => {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isResizing, setIsResizing] = useState(false);

  // Générer les créneaux horaires (6h à 22h)
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

  // Gérer le redimensionnement d'une activité
  const handleResize = (activityId, newDuration) => {
    if (newDuration < 15) return; // Minimum 15 minutes

    const newSchedule = { ...schedule };
    Object.keys(newSchedule).forEach(dayId => {
      Object.keys(newSchedule[dayId] || {}).forEach(timeSlot => {
        if (newSchedule[dayId][timeSlot]?.id === activityId) {
          newSchedule[dayId][timeSlot] = {
            ...newSchedule[dayId][timeSlot],
            duration: newDuration
          };
        }
      });
    });

    onScheduleChange(newSchedule);
    onNotification(`Durée ajustée à ${newDuration} minutes`, 'info');
  };

  // Gérer la sélection d'un créneau
  const handleSlotClick = (dayId, timeSlot) => {
    setSelectedSlot({ dayId, timeSlot });
  };

  return (
    <div className="weekly-planner">
      <div className="planner-header">
        <h2>Planning Hebdomadaire</h2>
        <div className="planner-controls">
          <button 
            className="print-btn"
            onClick={() => window.print()}
            title="Imprimer le planning"
          >
            🖨️ Imprimer
          </button>
        </div>
      </div>

      <div className="planner-grid">
        {/* En-tête avec les jours */}
        <div className="days-header">
          <div className="time-column-header"></div>
          {days.map(day => (
            <motion.div 
              key={day.id}
              className="day-header"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <span className="day-label">{day.label}</span>
              <span className="day-short">{day.short}</span>
            </motion.div>
          ))}
        </div>

        {/* Grille des créneaux */}
        <div className="time-slots">
          {timeSlots.map(timeSlot => (
            <div key={timeSlot.id} className="time-row">
              {/* Colonne des heures */}
              <div className="time-label">
                {timeSlot.label}
              </div>

              {/* Colonnes des jours */}
              {days.map(day => (
                <Droppable 
                  key={`${day.id}-${timeSlot.id}`}
                  droppableId={`${day.id}-${timeSlot.id}`}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`time-cell ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                      onClick={() => handleSlotClick(day.id, timeSlot.id)}
                    >
                      {/* Afficher l'activité si elle existe */}
                      {schedule[day.id]?.[timeSlot.id] && (
                        <ActivityBlock
                          activity={schedule[day.id][timeSlot.id]}
                          onResize={handleResize}
                          onNotification={onNotification}
                        />
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Légende des couleurs */}
      <div className="color-legend">
        <h3>Palette d'activités</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#8BA888' }}></div>
            <span>Nature / Calme</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#7B8654' }}></div>
            <span>Concentration</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#DCA44C' }}></div>
            <span>Énergie / Sport</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#C1683C' }}></div>
            <span>Passion / Créativité</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#4B7B73' }}></div>
            <span>Méditation / Détente</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyPlanner;
