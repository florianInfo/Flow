import React from 'react';
import { motion } from 'framer-motion';
import './AnimatedBackground.css';

const AnimatedBackground = () => {
  return (
    <div className="animated-background">
      {/* Particules flottantes */}
      <div className="floating-particles">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{
              y: [null, -20, 0],
              opacity: [0, 0.3, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            style={{
              backgroundColor: [
                '#8BA888', '#7B8654', '#DCA44C', '#C1683C', '#4B7B73'
              ][Math.floor(Math.random() * 5)]
            }}
          />
        ))}
      </div>

      {/* Motifs de bois animés */}
      <div className="wood-patterns">
        <motion.div
          className="wood-grain"
          animate={{
            x: [0, 10, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="wood-grain wood-grain-2"
          animate={{
            x: [0, -15, 0],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      {/* Effet de lumière douce */}
      <motion.div
        className="soft-light"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Feuilles flottantes */}
      <div className="floating-leaves">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="leaf"
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 50,
              rotate: Math.random() * 360
            }}
            animate={{
              y: -100,
              x: [null, Math.random() * 100 - 50],
              rotate: [null, Math.random() * 720]
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: "linear"
            }}
            style={{
              fontSize: Math.random() * 20 + 15
            }}
          >
            🍃
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AnimatedBackground;
