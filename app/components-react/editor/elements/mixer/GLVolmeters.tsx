import React, { useEffect, useRef } from 'react';
import { useGlVolmeters } from './useGlVolmeters';
import { Services } from 'components-react/service-provider';

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
    <div style={{ position: 'absolute' }}>
      <canvas
        ref="canvas"
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
