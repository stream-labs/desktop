import React, { useMemo, useRef } from 'react';
import StudioEditor from 'components-react/root/StudioEditor';
import useBaseElement from './hooks';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';

export default function Display() {
  const v = useVuex(() => ({
    showHorizontal: Services.SettingsManagerService.views.activeDisplays.horizontal,
    showVertical: Services.SettingsManagerService.views.activeDisplays.vertical,
  }));
  const containerRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const verticalRef = useRef<HTMLDivElement>(null);

  const width: string = useMemo(() => {
    return v.showHorizontal && v.showVertical ? '50%' : '100%';
  }, [v.showHorizontal, v.showVertical]);

  const { renderElement } = useBaseElement(
    <StudioEditor display="horizontal" />,
    { x: 0, y: 0 },
    horizontalRef.current,
  );
  const { renderElement: renderVertical } = useBaseElement(
    <StudioEditor display="vertical" />,
    { x: containerRef.current?.offsetWidth ?? 0, y: 0 },
    verticalRef.current,
  );

  return (
    <div ref={containerRef} style={{ height: '100%', display: 'flex', flexDirection: 'row' }}>
      {v.showHorizontal && (
        <div ref={horizontalRef} style={{ height: '100%', width }}>
          {renderElement()}
        </div>
      )}
      {v.showVertical && (
        <div ref={verticalRef} style={{ height: '100%', width }}>
          {renderVertical()}
        </div>
      )}
    </div>
  );
}
