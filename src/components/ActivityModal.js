import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Activity, COLOR_PALETTE, Planner } from '../models/DataModels';

const ActivityModal = ({ isOpen, onClose, onActivityCreated }) => {
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

    onActivityCreated(activity);
    setNewActivity({ title: '', description: '', color: 'sage' });
    onClose();
  };

  const handleClose = () => {
    setNewActivity({ title: '', description: '', color: 'sage' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] cursor-default select-none"
          onClick={handleClose}
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
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors select-none cursor-pointer"
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
                      className={`p-4 rounded-xl border-3 transition-all duration-200 select-none cursor-pointer ${
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
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 text-white border-2 border-white/30 rounded-xl hover:bg-white/20 hover:border-white/50 transition-all duration-200 font-medium select-none cursor-pointer"
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateActivity}
                  disabled={!newActivity.title.trim()}
                  className="flex-1 px-6 py-3 bg-white/20 border-2 border-white/30 text-white rounded-xl hover:bg-white/30 hover:border-white/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium select-none"
                >
                  Créer l'activité
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActivityModal;
