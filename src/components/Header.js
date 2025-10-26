import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Settings, Download } from 'lucide-react';

const Header = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-gradient-to-r from-wood-800 to-wood-700 text-white shadow-lg"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo et titre */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 wooden-raised rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-zen burned-text">Flow Planner</h1>
              <p className="text-white/80 text-sm">Planifiez votre semaine en toute sérénité</p>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center space-x-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 wooden-interactive rounded-lg transition-colors duration-200 select-none cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Imprimer</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 wooden-interactive rounded-lg transition-colors duration-200 select-none cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
