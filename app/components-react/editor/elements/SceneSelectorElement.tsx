import React, { useRef } from 'react';
import SceneSelector from './SceneSelector';
import useBaseElement from './hooks';

export default function SceneSelectorElement() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { renderElement } = useBaseElement(
    <SceneSelector />,
    { x: 200, y: 120 },
    containerRef.current,
  );

  return (
    <div ref={containerRef} style={{ height: '100%' }}>
      {renderElement()}
    </div>
  );
}
