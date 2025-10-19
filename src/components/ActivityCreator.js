import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { Activity, COLOR_PALETTE, Planner } from '../models/DataModels';
import ActivityBlock from './ActivityBlock';

const ActivityCreator = () => {
  const { planner, setPlanner, addNotification } = usePlanner();
  const [showCreator, setShowCreator] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    color: 'sage'
  });

  const handleCreateActivity = () => {
    if (!newActivity.title.trim()) return;

    const activity = new Activity(
      Date.now().toString(),
      newActivity.title.trim(),
      newActivity.color
    );
    
    // Ajouter la description si elle existe
    if (newActivity.description.trim()) {
      activity.description = newActivity.description.trim();
    }

    setPlanner(prev => {
      const newPlanner = new Planner();
      Object.assign(newPlanner, prev);
      newPlanner.addActivity(activity);
      return newPlanner;
    });

    addNotification(`Activité "${activity.title}" créée !`, 'positive');
    setNewActivity({ title: '', description: '', color: 'sage' });
    setShowCreator(false);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-wood-200 relative z-50">
      <div className="px-6 py-4">
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
                    className="cursor-move relative z-40"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Bouton d'ajout */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreator(true)}
            className="ml-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-sage to-moss text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 relative z-50"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Nouvelle activité</span>
          </motion.button>
        </div>
      </div>

      {/* Modal de création */}
      <AnimatePresence>
        {showCreator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999]"
            onClick={() => setShowCreator(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.3 
              }}
              className="rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl border border-white/20 relative z-[100000] text-white"
              style={{ backgroundColor: COLOR_PALETTE[newActivity.color]?.hex || COLOR_PALETTE.sage.hex }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">Nouvelle activité</h3>
                  <p className="text-white/80 text-sm mt-1">Créez une nouvelle activité pour votre planning</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCreator(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </motion.button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Nom de l'activité
                  </label>
                  <input
                    type="text"
                    value={newActivity.title}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 text-lg text-white placeholder-white/70"
                    placeholder="Ex: Sport, Journaling, Lecture..."
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Description (optionnelle)
                  </label>
                  <textarea
                    value={newActivity.description}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 text-white placeholder-white/70 resize-none"
                    placeholder="Décrivez votre activité..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Couleur
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {Object.entries(COLOR_PALETTE).map(([key, color]) => (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setNewActivity(prev => ({ ...prev, color: key }))}
                        className={`p-4 rounded-xl border-3 transition-all duration-200 ${
                          newActivity.color === key
                            ? 'border-white shadow-lg ring-2 ring-white/50'
                            : 'border-white/30 hover:border-white/60 hover:shadow-md'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={`${color.name} - ${color.category}`}
                      />
                    ))}
                  </div>
                </div>


                <div className="flex space-x-4 pt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreator(false)}
                    className="flex-1 px-6 py-3 text-white border-2 border-white/30 rounded-xl hover:bg-white/20 hover:border-white/50 transition-all duration-200 font-medium"
                  >
                    Annuler
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateActivity}
                    disabled={!newActivity.title.trim()}
                    className="flex-1 px-6 py-3 bg-white/20 border-2 border-white/30 text-white rounded-xl hover:bg-white/30 hover:border-white/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Créer l'activité
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivityCreator;
