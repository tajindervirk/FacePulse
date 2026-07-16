import React from 'react';
import { Camera, Layers, Zap, ZapOff } from 'lucide-react';
import { motion } from 'framer-motion';

export const ControlPill = ({ overlayMode, setOverlayMode, toggleZen, zenMode, onCapture }) => {
  const nextOverlay = () => {
    const modes = ['mesh', 'contour', 'dots', 'none'];
    const idx = modes.indexOf(overlayMode);
    setOverlayMode(modes[(idx + 1) % modes.length]);
  };

  return (
    <motion.div 
      className="glass-panel"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem 1.5rem',
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        borderRadius: '999px',
        border: '1px solid hsl(var(--border))'
      }}
    >
      <button 
        onClick={nextOverlay}
        style={btnStyle}
        title={`Overlay Mode: ${overlayMode}`}
      >
        <Layers size={20} color="hsl(var(--foreground))" />
      </button>

      <div style={dividerStyle} />

      <button onClick={onCapture} style={btnStyle} title="Capture Screenshot">
        <Camera size={20} color="hsl(var(--foreground))" />
      </button>

      <div style={dividerStyle} />

      <button onClick={toggleZen} style={btnStyle} title="Toggle Zen Mode">
        {zenMode ? <ZapOff size={20} color="hsl(var(--muted-foreground))" /> : <Zap size={20} color="hsl(var(--foreground))" />}
      </button>
    </motion.div>
  );
};

const btnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.5rem',
  borderRadius: '50%',
  transition: 'background-color 0.2s'
};

const dividerStyle = {
  width: '1px',
  height: '24px',
  background: 'hsl(var(--border))'
};
