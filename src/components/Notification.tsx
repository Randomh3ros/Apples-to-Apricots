import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 text-white text-center p-4 rounded-lg shadow-lg z-50 text-2xl font-bold text-neon-glow text-3d-shadow"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
