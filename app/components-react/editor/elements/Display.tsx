import React, { useRef } from 'react';
import StudioEditor from 'components-react/root/StudioEditor';
import useBaseElement from './hooks';

export default function Display() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { renderElement } = useBaseElement(<StudioEditor />, { x: 0, y: 0 }, containerRef.current);

  return (
    <div ref={containerRef} style={{ height: '100%' }}>
      {renderElement()}
    </div>
  );
}
