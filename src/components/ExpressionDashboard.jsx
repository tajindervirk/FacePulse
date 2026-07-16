import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIZED_BLENDSHAPES } from '../utils/expressionLogic';

export const ExpressionDashboard = ({ faces }) => {
  const [activeTab, setActiveTab] = useState('Brows');
  const [history, setHistory] = useState([]);

  React.useEffect(() => {
    if (faces && faces.length > 0) {
      const primaryFace = faces[0];
      setHistory(prev => {
        const newHistory = [...prev, { time: Date.now(), ...primaryFace }];
        if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
        return newHistory;
      });
    }
  }, [faces]);

  if (!faces || faces.length === 0) {
    return (
      <div className="glass-panel" style={{ ...panelStyle, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <h2 className="font-mono text-sm tracking-widest text-muted-foreground">WAITING FOR SUBJECT...</h2>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', height: '100%' }}>
      
      {/* Primary Expression Cards */}
      {faces.map((face, idx) => (
        <motion.div 
          key={idx}
          className="glass-panel"
          style={{ ...cardStyle, flexShrink: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '4.5rem', filter: 'grayscale(0.2)', lineHeight: 1, flexShrink: 0, textShadow: '0 4px 20px rgba(255,255,255,0.1)' }}>{face.emoji}</div>
            <div>
              <div className="sub-label">CURRENT EXPRESSION</div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0, letterSpacing: '-0.02em' }}>{face.expression}</h2>
            </div>
          </div>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="sub-label">CONFIDENCE</span>
              <span className="font-mono" style={{ fontSize: '0.85rem' }}>{face.confidence.toFixed(1)}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'hsl(var(--muted))', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div 
                animate={{ width: `${face.confidence}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                style={{ height: '100%', background: 'hsl(var(--foreground))', borderRadius: '3px' }}
              />
            </div>
          </div>
        </motion.div>
      ))}

      {/* History Sparkline */}
      <div className="glass-panel" style={{ ...panelStyle, flexShrink: 0 }}>
        <div className="sub-label" style={{ marginBottom: '1rem' }}>EMOTION HISTORY</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '60px', gap: '3px' }}>
          {history.map((h) => (
            <motion.div 
              key={h.time}
              initial={{ height: 0 }}
              animate={{ height: `${h.confidence}%` }}
              style={{
                flex: 1,
                background: 'hsl(var(--muted-foreground))',
                opacity: 0.7,
                borderTopLeftRadius: '2px',
                borderTopRightRadius: '2px',
                minWidth: '2px'
              }}
              title={h.expression}
            />
          ))}
        </div>
      </div>

      {/* Blendshape Architect (Flex 1 to fill remaining space) */}
      <div className="glass-panel" style={{ ...panelStyle, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="sub-label" style={{ marginBottom: '1rem', flexShrink: 0 }}>BLENDSHAPE ARCHITECT</div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
          {Object.keys(CATEGORIZED_BLENDSHAPES).map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveTab(cat)}
              style={{
                background: activeTab === cat ? 'hsl(var(--muted))' : 'transparent',
                color: activeTab === cat ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.8rem',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Blendshape Bars (Scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.75rem', paddingLeft: '0.2rem', paddingBottom: '1rem' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ staggerChildren: 0.05 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}
            >
              {faces[0].blendshapes
                .filter(b => CATEGORIZED_BLENDSHAPES[activeTab].includes(b.categoryName))
                .sort((a, b) => b.score - a.score)
                .map((b, i) => (
                  <motion.div 
                    key={b.categoryName}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'hsl(var(--foreground))', letterSpacing: '0.01em' }}>{b.categoryName}</span>
                      <span className="font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{b.score.toFixed(3)}</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'hsl(var(--muted))', borderRadius: '2px' }}>
                      <motion.div 
                        animate={{ width: `${b.score * 100}%` }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        style={{ height: '100%', background: 'hsl(var(--foreground))', borderRadius: '2px' }}
                      />
                    </div>
                  </motion.div>
                ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
};

const panelStyle = {
  padding: '1.5rem'
};

const cardStyle = {
  ...panelStyle,
  borderTop: '2px solid hsl(var(--foreground))'
};
