import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { usePlanner } from '../context/PlannerContext';
import { Creneaux, DAYS, TIME_SLOTS, Planner } from '../models/DataModels';
import ActivityBlock from './ActivityBlock';
import ResizableActivity from './ResizableActivity';

const TimeSlot = ({ day, time, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${day}-${time}`,
    data: { day, time }
  });

  return (
    <div
      ref={setNodeRef}
      className={`
         h-[20px] relative select-none wooden-slot
        ${isOver ? 'bg-green-300/30' : ''}
        ${time.endsWith(':00') ? 'border-t-2 border-amber-800' : 'border-t border-dotted border-amber-700'}
      `}
    >
      {children}
    </div>
  );
};

const DraggableActivity = ({ activity, isTemplate = false }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `activity-${activity.id}`,
    data: { activity, isTemplate }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${isDragging ? 'z-50' : ''} cursor-grab select-none`}
    >
      <ActivityBlock
        activity={activity}
        isTemplate={isTemplate}
        className={isDragging ? 'opacity-50' : ''}
      />
    </div>
  );
};

const PlannerGrid = () => {
  const { planner, setPlanner, addNotification } = usePlanner();
  const [activeId, setActiveId] = useState(null);
  const [draggedActivity, setDraggedActivity] = useState(null);
  const scrollContainerRef = useRef(null);

  // Générer les créneaux pour chaque jour
  useEffect(() => {
    const generateTimeSlots = () => {
      const newCreneaux = [];
      DAYS.forEach((day, dayIndex) => {
        TIME_SLOTS.forEach((time, timeIndex) => {
          const nextTime = TIME_SLOTS[timeIndex + 1];
          if (nextTime) {
            const creneaux = new Creneaux(
              `slot-${dayIndex}-${time}`,
              dayIndex,
              time,
              nextTime
            );
            newCreneaux.push(creneaux);
          }
        });
      });
      
      setPlanner(prev => {
        const newPlanner = new Planner();
        Object.assign(newPlanner, prev);
        newPlanner.creneaux = newCreneaux;
        return newPlanner;
      });
    };

    if (planner.creneaux.length === 0) {
      generateTimeSlots();
    }
  }, [planner.creneaux.length, setPlanner]);

  // Positionner le scroll sur 8h00 au chargement
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Trouver l'index de 8h00 dans TIME_SLOTS
      const targetTime = '08:00';
      const targetIndex = TIME_SLOTS.findIndex(time => time === targetTime);
      
      if (targetIndex !== -1) {
        // Calculer la position de scroll (8h00 = index 8, chaque créneau fait 20px)
        const scrollPosition = targetIndex * 20;
        scrollContainerRef.current.scrollTop = scrollPosition;
      }
    }
  }, [planner.creneaux.length]);

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    if (active.data.current?.isTemplate) {
      setDraggedActivity(active.data.current.activity);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedActivity(null);

    if (!over) return;

    const activity = active.data.current?.activity;
    if (!activity) return;

    // Si c'est un template, créer une nouvelle activité programmée
    if (active.data.current?.isTemplate) {
      const slotData = over.data.current;
      if (slotData?.day !== undefined && slotData?.time) {
        const creneaux = planner.creneaux.find(c => 
          c.day === slotData.day && c.startTime === slotData.time
        );
        
        if (creneaux) {
          const scheduledActivity = {
            id: Date.now().toString(),
            activityId: activity.id,
            creneauxId: creneaux.id,
            notes: '',
            createdAt: new Date().toISOString(),
            completed: false
          };

          setPlanner(prev => {
            const newPlanner = new Planner();
            Object.assign(newPlanner, prev);
            const success = newPlanner.scheduleActivity(scheduledActivity);
            if (success) {
              addNotification(`"${activity.title}" programmée !`, 'positive');
            } else {
              addNotification('Créneau déjà occupé', 'negative');
            }
            return newPlanner;
          });
        }
      }
    }
  };

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

  return (
    <div className="bg-amber-50">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Header fixe avec les jours */}
        <div className="flex w-full wooden-border sticky top-0 z-20 flex-1 ">
          {/* Colonne des heures (fixe) */}
          <div className="wooden-raised border-r border-amber-800 w-16 min-w-[60px] flex items-center justify-center">
            <span className="burned-text font-medium text-xs">Heures</span>
          </div>
          
          {/* En-têtes des jours */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex-1 min-w-[120px] flex items-center justify-center border-r border-dotted border-amber-700 wooden-raised">
              <span className="burned-text font-semibold text-sm">{day}</span>
            </div>
          ))}
        </div>

        {/* Container scrollable pour le contenu - scroll vertical uniquement */}
        <div ref={scrollContainerRef} className="flex-1">
          <div className="flex">
            {/* Colonne des heures (scrollable) - synchronisée avec le contenu */}
            <div className="wooden-column border-r border-amber-800 w-16 min-w-[60px] sticky left-0 z-10">
              {TIME_SLOTS.map((time) => (
                <div key={time} className={`h-[20px] flex items-center justify-center text-xs burned-text ${
                  time.endsWith(':00') ? 'border-t border-amber-600' : 'border-t border-dotted border-amber-500'
                }`}>
                  {time.endsWith(':00') && time}
                </div>
              ))}
            </div>

            {/* Colonnes des jours (scrollables) */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex-1 min-w-[120px] border-r border-dotted border-amber-700 wooden-column">
                {TIME_SLOTS.map((time) => (
                  <TimeSlot key={`${day}-${time}`} day={dayIndex} time={time}>
                    <div className="p-1 space-y-1">
                      {getScheduledActivitiesForSlot(dayIndex, time).map((scheduledActivity) => (
                        <motion.div
                          key={scheduledActivity.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ResizableActivity
                            scheduledActivity={scheduledActivity}
                            day={dayIndex}
                            time={time}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </TimeSlot>
                ))}
              </div>
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeId && draggedActivity ? (
            <ActivityBlock
              activity={draggedActivity}
              className="opacity-90 scale-110"
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default PlannerGrid;
