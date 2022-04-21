import React, { useEffect, useRef, useState } from 'react';
import { AudioSource } from 'services/audio';
import { Volmeter2d } from 'services/audio/volmeter-2d';

export default function MixerVolmeter(p: { audioSource: AudioSource; volmetersEnabled: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const spacer = useRef<HTMLDivElement>(null);

  const [renderingInitialized, setRenderingInitialized] = useState(false);

  useEffect(() => {
    if (!spacer.current || !canvas.current) return;
    const volmeterRenderer = new Volmeter2d(
      p.audioSource,
      canvas.current,
      spacer.current,
      () => setRenderingInitialized(true),
      p.volmetersEnabled,
    );

    return () => {
      if (volmeterRenderer) volmeterRenderer.destroy();
    };
  }, [canvas.current, spacer.current]);

  return (
    <div className="volmeter-container">
      {renderingInitialized && (
        <canvas
          style={{ position: 'absolute', overflow: 'hidden', backgroundColor: 'var(--border)' }}
          ref={canvas}
        />
      )}
      <div style={{ margin: '10px 0' }} ref={spacer} />
    </div>
  );
}
