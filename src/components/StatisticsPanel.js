import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, TrendingUp, Target } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';

const RankingItem = ({ stat, position, previousPosition, isNew = false }) => {
  const positionChange = previousPosition !== null ? previousPosition - position : 0;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`
        flex items-center justify-between p-2 rounded-lg
        ${position === 1 ? 'bg-gradient-to-r from-gold to-copper text-white' : 
          position === 2 ? 'bg-gradient-to-r from-sage to-moss text-white' :
          position === 3 ? 'bg-gradient-to-r from-teal to-sage text-white' :
          'bg-white border border-wood-200'}
        shadow-sm hover:shadow-md transition-all duration-200
        ${isNew ? 'ring-2 ring-gold ring-opacity-50' : ''}
      `}
    >
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
            <span className="font-bold text-xs">#{position}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stat.activity.color }}
            />
            <span className="font-medium text-xs truncate max-w-[100px]">
              {stat.activity.title}
            </span>
          </div>
        </div>

      <div className="flex items-center space-x-1">
        <div className="text-right">
          <div className="text-xs font-semibold">
            {Math.floor(stat.totalMinutes / 60)}h {stat.totalMinutes % 60}min
          </div>
          <div className="text-xs opacity-75">
            {stat.scheduledCount}s
          </div>
        </div>
        
        {positionChange !== 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`
              px-2 py-1 rounded-full text-xs font-bold
              ${positionChange > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
            `}
          >
            {positionChange > 0 ? '+' : ''}{positionChange}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const StatisticsPanel = () => {
  const { planner } = usePlanner();
  const [stats, setStats] = useState([]);
  const [previousStats, setPreviousStats] = useState([]);
  const [newItems, setNewItems] = useState(new Set());

  useEffect(() => {
    const newStats = planner.getActivityStats();
    
    // Détecter les nouveaux éléments
    const newItemIds = new Set();
    newStats.forEach(stat => {
      const wasPresent = previousStats.some(prev => prev.activity.id === stat.activity.id);
      if (!wasPresent) {
        newItemIds.add(stat.activity.id);
      }
    });
    
    if (newItemIds.size > 0) {
      setNewItems(newItemIds);
      setTimeout(() => setNewItems(new Set()), 2000);
    }
    
    setPreviousStats(stats);
    setStats(newStats);
  }, [planner.scheduledActivities, planner.activities]);

  const totalTime = stats.reduce((sum, stat) => sum + stat.totalMinutes, 0);
  const averageTime = stats.length > 0 ? totalTime / stats.length : 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-gradient-to-r from-wood-800 to-wood-700 text-white shadow-lg"
    >
      <div className="px-4 py-2">
        {/* En-tête des statistiques */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-gold" />
            <h2 className="text-lg font-bold">Classement</h2>
          </div>
          
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{Math.floor(totalTime / 60)}h {totalTime % 60}min</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="w-3 h-3" />
              <span>Moy: {Math.floor(averageTime / 60)}h {Math.floor(averageTime % 60)}min</span>
            </div>
          </div>
        </div>

        {/* Classement en colonnes dynamiques */}
        <div className="flex flex-wrap gap-2">
          {(() => {
            const columns = [];
            const itemsPerColumn = 5;
            const totalColumns = Math.ceil(stats.length / itemsPerColumn);
            
            for (let columnIndex = 0; columnIndex < totalColumns; columnIndex++) {
              const columnStats = stats.slice(columnIndex * itemsPerColumn, (columnIndex + 1) * itemsPerColumn);
              
              columns.push(
                <div key={columnIndex} className="flex-1 min-w-[200px] space-y-1">
                  <div className="text-center text-xs font-medium text-wood-200 mb-1">
                    #{columnIndex + 1}
                  </div>
                  
                  <AnimatePresence>
                    {columnStats.map((stat, index) => {
                      const position = columnIndex * itemsPerColumn + index + 1;
                      const previousPosition = previousStats.findIndex(
                        prev => prev.activity.id === stat.activity.id
                      ) + 1;
                      const isNew = newItems.has(stat.activity.id);
                      
                      return (
                        <RankingItem
                          key={stat.activity.id}
                          stat={stat}
                          position={position}
                          previousPosition={previousPosition}
                          isNew={isNew}
                        />
                      );
                    })}
                  </AnimatePresence>
                  
                  {columnStats.length === 0 && (
                    <div className="text-center text-wood-300 text-xs py-4">
                      Aucune activité
                    </div>
                  )}
                </div>
              );
            }
            
            return columns;
          })()}
        </div>

        {/* Indicateur de mise à jour en temps réel */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center justify-center mt-2 space-x-1 text-xs text-wood-300"
        >
          <TrendingUp className="w-3 h-3" />
          <span>Live</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StatisticsPanel;
