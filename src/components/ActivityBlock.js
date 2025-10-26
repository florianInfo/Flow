import React from 'react';
import { motion } from 'framer-motion';
import { Edit } from 'lucide-react';
import { COLOR_PALETTE } from '../models/DataModels';

const ActivityBlock = ({ activity, isTemplate = false, className = '', style = {}, onEdit }) => {
  const colorInfo = COLOR_PALETTE[activity.color] || COLOR_PALETTE.sage;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative px-4 py-2 rounded-lg shadow-sm border border-white/20
        text-white font-medium text-sm min-w-[120px] text-center select-none
        ${isTemplate ? 'cursor-move' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        backgroundColor: colorInfo.hex,
        ...style
      }}
    >
      <div className="flex flex-col justify-center space-y-1">
        <div className="flex items-center justify-center space-x-2">
          <span className="truncate font-medium">{activity.title}</span>
          {isTemplate && onEdit && (
            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Edit button clicked for activity:', activity.title);
                onEdit(activity);
              }}
              className="p-1 hover:bg-white/20 rounded-full transition-colors select-none cursor-pointer relative z-10"
              title="Modifier l'activité"
            >
              <Edit className="w-3 h-3 text-white/80" />
            </motion.button>
          )}
        </div>
        {activity.description && (
          <div className="text-xs opacity-80 truncate text-center">
            {activity.description}
          </div>
        )}
      </div>
      
      {/* Effet de brillance */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default ActivityBlock;
