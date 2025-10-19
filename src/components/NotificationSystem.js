import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const Notification = ({ notification, onRemove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'positive':
        return <CheckCircle className="w-5 h-5" />;
      case 'negative':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        notification flex items-center space-x-3 p-4 rounded-lg shadow-lg
        ${notification.type === 'positive' ? 'notification.positive' : 
          notification.type === 'negative' ? 'notification.negative' :
          'bg-wood-600'}
        max-w-sm
      `}
    >
      {getIcon()}
      <span className="font-medium">{notification.message}</span>
    </motion.div>
  );
};

const NotificationSystem = ({ notifications }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            notification={notification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;
