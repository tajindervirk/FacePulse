import React, { useState, useEffect } from 'react';
import { FaceScanner } from './components/FaceScanner';
import { Moon, Sun, CloudRain } from 'lucide-react';

function App() {
  const [theme, setTheme] = useState('dark');
  const [emojiRainEnabled, setEmojiRainEnabled] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Check prefers-reduced-motion for Emoji Rain default
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setEmojiRainEnabled(false);
    }
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleEmojiRain = () => setEmojiRainEnabled(prev => !prev);
  const toggleZen = () => setZenMode(prev => !prev);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', padding: '1rem 2rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* 3D Animated Spatial Grid Background */}
      <div className="bg-grid" />
      
      {/* Top Navbar */}
      {!zenMode && (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem', flexShrink: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'hsl(var(--foreground))' }}>
              Face<span style={{ color: 'hsl(var(--muted-foreground))' }}>Pulse</span>
            </h1>
            <p className="sub-label" style={{ marginTop: '0.25rem' }}>Real-time Facial Analysis</p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={toggleEmojiRain} 
              className="glass-panel"
              style={{ ...headerBtnStyle, color: emojiRainEnabled ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
              title="Toggle Emoji Rain"
            >
              <CloudRain size={18} />
            </button>
            <button 
              onClick={toggleTheme} 
              className="glass-panel"
              style={{ ...headerBtnStyle, color: 'hsl(var(--foreground))' }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'stretch', justifyContent: 'center', overflow: 'hidden', height: '100%', zIndex: 10 }}>
        <FaceScanner 
          emojiRainEnabled={emojiRainEnabled} 
          zenMode={zenMode} 
          toggleZen={toggleZen} 
        />
      </main>

    </div>
  );
}

const headerBtnStyle = {
  border: '1px solid hsl(var(--border))',
  padding: '0.5rem 0.75rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
  background: 'transparent'
};

export default App;
