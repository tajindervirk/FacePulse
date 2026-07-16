import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useFaceExpression } from '../hooks/useFaceExpression';
import { ControlPill } from './ControlPill';
import { ExpressionDashboard } from './ExpressionDashboard';
import { EmojiRain } from './EmojiRain';

export const FaceScanner = ({ emojiRainEnabled, zenMode, toggleZen }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const videoContainerRef = useRef(null);
  
  const [overlayMode, setOverlayMode] = useState('mesh');
  
  // Pinch-to-zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const lastPinchDist = useRef(null);
  const lastTouchCenter = useRef(null);
  const isPinching = useRef(false);

  const { faces, pinchDistance, isLoading, error } = useFaceExpression(videoRef, canvasRef, overlayMode);

  // --- Camera Pinch-to-Zoom (Hand Gesture) ---
  const lastCameraPinch = useRef(null);
  useEffect(() => {
    if (pinchDistance !== null) {
      if (lastCameraPinch.current !== null) {
        // Delta between frames (spreading fingers = positive delta)
        const delta = pinchDistance - lastCameraPinch.current;
        // Sensitivity multiplier
        setZoomLevel(prev => Math.max(1, Math.min(5, prev + delta * 8)));
      }
      lastCameraPinch.current = pinchDistance;
    } else {
      lastCameraPinch.current = null; // Freeze zoom when hand leaves
    }
  }, [pinchDistance]);

  // 3D Parallax Mouse Tracking
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const handleMouseMove = (e) => {
    const normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
    const normalizedY = (e.clientY / window.innerHeight) * 2 - 1;
    x.set(normalizedX);
    y.set(normalizedY);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const rotateX = useTransform(y, [-1, 1], [3, -3]);
  const rotateY = useTransform(x, [-1, 1], [-3, 3]);
  const dashboardRotateX = useTransform(y, [-1, 1], [2, -2]);
  const dashboardRotateY = useTransform(x, [-1, 1], [-2, 2]);

  // --- Pinch-to-zoom touch handlers ---
  const getDistance = (t1, t2) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (t1, t2) => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2
  });

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      isPinching.current = true;
      lastPinchDist.current = getDistance(e.touches[0], e.touches[1]);
      lastTouchCenter.current = getCenter(e.touches[0], e.touches[1]);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && isPinching.current) {
      e.preventDefault();
      const currentDist = getDistance(e.touches[0], e.touches[1]);
      const currentCenter = getCenter(e.touches[0], e.touches[1]);

      // Zoom
      if (lastPinchDist.current) {
        const scale = currentDist / lastPinchDist.current;
        setZoomLevel(prev => Math.min(Math.max(prev * scale, 1), 5));
      }

      // Pan (only when zoomed in)
      if (lastTouchCenter.current) {
        // Because of the scaleX(-1) in mediaTransform, horizontal pan must be inverted
        const dx = -(currentCenter.x - lastTouchCenter.current.x);
        const dy = currentCenter.y - lastTouchCenter.current.y;
        setPanOffset(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));
      }

      lastPinchDist.current = currentDist;
      lastTouchCenter.current = currentCenter;
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) {
      isPinching.current = false;
      lastPinchDist.current = null;
      lastTouchCenter.current = null;
    }
  }, []);

  // Mouse wheel zoom (for desktop testing)
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel(prev => {
      const newZoom = Math.min(Math.max(prev * delta, 1), 5);
      // Reset pan when zooming back to 1
      if (newZoom <= 1.01) {
        setPanOffset({ x: 0, y: 0 });
        return 1;
      }
      return newZoom;
    });
  }, []);

  // Reset zoom on double-tap
  const handleDoubleClick = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Attach non-passive touch events for pinch
  useEffect(() => {
    const container = videoContainerRef.current;
    if (!container) return;
    
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel]);

  const captureScreenshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const compCanvas = document.createElement('canvas');
    compCanvas.width = videoRef.current.videoWidth;
    compCanvas.height = videoRef.current.videoHeight;
    const ctx = compCanvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, compCanvas.width, compCanvas.height);
    ctx.drawImage(canvasRef.current, 0, 0, compCanvas.width, compCanvas.height);
    const link = document.createElement('a');
    link.download = `expression-capture-${Date.now()}.png`;
    link.href = compCanvas.toDataURL('image/png');
    link.click();
  }, []);

  const primaryFace = faces && faces.length > 0 ? faces[0] : null;

  // Compute the video + canvas transform for zoom/pan
  const mediaTransform = `scaleX(-1) scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`;

  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        display: 'flex', 
        gap: '2rem', 
        width: '100%', 
        height: '100%', 
        alignItems: 'stretch',
        perspective: '1200px'
      }}
    >
      {emojiRainEnabled && !zenMode && primaryFace && (
        <EmojiRain enabled={emojiRainEnabled} emotionEmoji={primaryFace.emoji} />
      )}

      {/* Left Column: Video & Canvas (65% width) */}
      <motion.div 
        ref={videoContainerRef}
        onDoubleClick={handleDoubleClick}
        style={{ 
          flex: '2',
          position: 'relative',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          display: 'flex',
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          cursor: zoomLevel > 1 ? 'grab' : 'default',
          touchAction: 'none' // disable default touch handling for pinch
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {isLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--foreground))', zIndex: 10 }}>
            <div className="font-mono" style={{ fontSize: '0.85rem', letterSpacing: '0.1em' }}>INITIALIZING AI INFERENCE...</div>
          </div>
        )}
        
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', background: 'hsl(var(--background)/0.8)', zIndex: 10, padding: '2rem', textAlign: 'center' }}>
            <div className="font-mono">{error}</div>
          </div>
        )}

        {/* Zoom indicator */}
        {zoomLevel > 1.05 && (
          <div style={{
            position: 'absolute', top: '12px', left: '12px', zIndex: 20,
            padding: '0.35rem 0.75rem', borderRadius: 'var(--radius)',
            background: 'hsl(var(--card) / 0.7)', backdropFilter: 'blur(12px)',
            border: '1px solid hsl(var(--border))',
            fontSize: '0.75rem', fontWeight: 500
          }} className="font-mono">
            {zoomLevel.toFixed(1)}×
          </div>
        )}

        <video
          ref={videoRef}
          style={{ 
            width: '100%', height: '100%', objectFit: 'cover', 
            transform: mediaTransform,
            transformOrigin: 'center center',
            transition: isPinching.current ? 'none' : 'transform 0.15s ease-out'
          }}
          playsInline
          muted
        />
        
        <canvas
          ref={canvasRef}
          style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            objectFit: 'cover', 
            transform: mediaTransform,
            transformOrigin: 'center center',
            transition: isPinching.current ? 'none' : 'transform 0.15s ease-out',
            pointerEvents: 'none' 
          }}
        />

        {!isLoading && !error && (
          <ControlPill 
            overlayMode={overlayMode} 
            setOverlayMode={setOverlayMode} 
            toggleZen={toggleZen}
            zenMode={zenMode}
            onCapture={captureScreenshot}
          />
        )}
      </motion.div>

      {/* Right Column: Dashboard (35% width) */}
      {!zenMode && (
        <motion.div 
          style={{ 
            flex: '1',
            zIndex: 10, 
            height: '100%', 
            rotateX: dashboardRotateX,
            rotateY: dashboardRotateY,
            transformStyle: "preserve-3d"
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <ExpressionDashboard faces={faces} />
        </motion.div>
      )}
      
      {/* Zen Mode Floating UI */}
      {zenMode && primaryFace && (
        <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: '3rem' }}>{primaryFace.emoji}</span>
            <span className="font-mono" style={{ fontSize: '2rem', fontWeight: 'bold' }}>{primaryFace.expression}</span>
          </div>
        </div>
      )}
    </div>
  );
};
