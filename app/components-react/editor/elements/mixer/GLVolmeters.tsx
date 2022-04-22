import React, { useEffect, useRef } from 'react';
import { useGlVolmeters } from './useGlVolmeters';

/**
 * Renders volmeters for the current scene via WebGL
 */
export default function GLVolmeters() {
  const canvas = useRef<HTMLCanvasElement>(null);

  const { subscribeVolmeters, setupNewCanvas, beforeDestroy, audioSources } = useGlVolmeters();

  useEffect(() => {
    if (!canvas.current) return;
    setupNewCanvas(canvas.current);

    return () => beforeDestroy();
  }, [canvas.current]);

  useEffect(() => subscribeVolmeters(), [audioSources]);

  return (
    <div style={{ position: 'absolute', left: '17px', right: '17px', height: '100%' }}>
      <canvas
        ref={canvas}
        style={{
          display: 'block',
          position: 'absolute',
          top: 0,
          right: 0,
          left: 0,
          height: '100%',
        }}
      />
    </div>
  );
}
