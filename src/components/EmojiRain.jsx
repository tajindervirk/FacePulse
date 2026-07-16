import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const EmojiRain = ({ enabled, emotionEmoji }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!enabled || !emotionEmoji) return;

    // Generate a particle every 400ms
    const interval = setInterval(() => {
      const id = Date.now() + Math.random();
      const x = Math.random() * 100; // random left %
      const size = Math.random() * 2 + 1; // 1rem to 3rem
      const duration = Math.random() * 4 + 4; // 4s to 8s
      const delay = Math.random() * 2;
      const blur = Math.random() * 8; // Z-depth blur

      setParticles(prev => [...prev, { id, x, size, duration, delay, blur, emoji: emotionEmoji }]);
      
      // Cleanup particles that have finished falling
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== id));
      }, (duration + delay) * 1000);
      
    }, 400);

    return () => clearInterval(interval);
  }, [enabled, emotionEmoji]);

  if (!enabled) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 50, // above video, below UI
      overflow: 'hidden'
    }}>
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ y: '-10vh', opacity: 0, rotate: 0 }}
            animate={{ 
              y: '110vh', 
              opacity: [0, 0.3, 0.3, 0], 
              rotate: Math.random() > 0.5 ? 360 : -360 
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: p.duration,
              delay: p.delay,
              ease: "linear" 
            }}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              fontSize: `${p.size}rem`,
              filter: `blur(${p.blur}px)`,
              mixBlendMode: 'screen',
              willChange: 'transform, opacity'
            }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
