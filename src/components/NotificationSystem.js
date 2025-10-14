import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './NotificationSystem.css';

const NotificationSystem = ({ notifications, onRemoveNotification }) => {
  return (
    <div className="notification-system">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            className={`notification ${notification.type}`}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="notification-content">
              <div className="notification-icon">
                {notification.type === 'success' && '✅'}
                {notification.type === 'info' && 'ℹ️'}
                {notification.type === 'warning' && '⚠️'}
                {notification.type === 'error' && '❌'}
              </div>
              
              <div className="notification-text">
                <div className="notification-message">
                  {notification.message}
                </div>
                <div className="notification-time">
                  {formatTime(notification.timestamp)}
                </div>
              </div>
              
              <button
                className="notification-close"
                onClick={() => onRemoveNotification(notification.id)}
                title="Fermer la notification"
              >
                ✕
              </button>
            </div>
            
            {/* Barre de progression pour l'auto-suppression */}
            <motion.div
              className="notification-progress"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: 'linear' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Formater l'heure de la notification
const formatTime = (timestamp) => {
  const now = new Date();
  const diff = now - timestamp;
  
  if (diff < 1000) return 'À l\'instant';
  if (diff < 60000) return 'Il y a quelques secondes';
  if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)}min`;
  return timestamp.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export default NotificationSystem;
