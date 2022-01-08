import React, { useRef } from 'react';
import RecentEvents from './RecentEvents';
import useBaseElement from './hooks';

export default function MiniFeed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { renderElement } = useBaseElement(
    <RecentEvents isOverlay={false} />,
    { x: 330, y: 90 },
    containerRef.current,
  );

  return (
    <div ref={containerRef} style={{ height: '100%' }}>
      {renderElement()}
    </div>
  );
}
