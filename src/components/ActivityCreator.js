import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import ActivityBlock from './ActivityBlock';

const ActivityCreator = () => {
  const { planner, openActivityModal, editActivity, deleteActivity } = usePlanner();

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-wood-200 relative z-50">
      <div className="p-2 h-24 overflow-y-auto">
        <div className="flex items-center justify-between">
          {/* Activités existantes */}
          <div className="flex items-center space-x-3 flex-1 overflow-x-auto">
            <AnimatePresence>
              {planner.activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <ActivityBlock
                    activity={activity}
                    isTemplate={true}
                    className="cursor-move relative z-40 select-none"
                    onEdit={editActivity}
                    onDelete={deleteActivity}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Bouton d'ajout */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openActivityModal}
            className="ml-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-sage to-moss text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 relative z-50 select-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Nouvelle activité</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ActivityCreator;
