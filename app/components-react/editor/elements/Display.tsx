import React, { useRef } from 'react';
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
  const verticalRef = useRef<HTMLDivElement>(null);
  const { renderElement } = useBaseElement(<StudioEditor />, { x: 0, y: 0 }, containerRef.current);
  const { renderVertical } = useBaseElement(
    <StudioEditor />,
    { x: 500, y: 500 },
    verticalRef.current,
  );

  return (
    <div ref={containerRef} style={{ height: '100%' }}>
      {renderElement()}
    </div>
  );

  // return (
  //   <>
  //     {v.showHorizontal && (
  //       <div ref={containerRef} style={{ height: '100%' }}>
  //         {renderElement()}
  //       </div>
  //     )}
  //     {v.showVertical && (
  //       <div ref={verticalRef} style={{ height: '100%' }}>
  //         {renderVertical()}
  //       </div>
  //     )}
  //   </>
  // );
}
