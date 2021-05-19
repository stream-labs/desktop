import React, { useEffect, useRef } from 'react';
import { useVuex } from '../hooks';
import { Services } from '../service-provider';
import { Display as OBSDisplay } from '../../services/video';
import uuid from 'uuid/v4';

interface DisplayProps {
  sourceId?: string;
  paddingSize?: number;
  drawUI?: boolean;
  renderingMode?: number;
  onOutputResize?: (region: IRectangle) => void;
  clickHandler?: (event: React.MouseEvent) => void;
}

export default function Display(props: DisplayProps) {
  const { VideoService, CustomizationService } = Services;

  const p = {
    paddingSize: 0,
    drawUI: false,
    clickHandler: () => {},
    onOutputResize: () => {},
    ...props,
  };

  const v = useVuex(
    () => ({
      paddingColor: CustomizationService.views.displayBackground,
      baseResolution: VideoService.baseResolution,
    }),
    false,
  );

  const obsDisplay = useRef<OBSDisplay>();
  const displayEl = useRef<HTMLDivElement>(null);

  useEffect(updateDisplay, [p.sourceId, v.paddingColor]);
  useEffect(refreshOutputRegion, [v.baseResolution]);

  function refreshOutputRegion() {
    if (!obsDisplay.current) return;
    obsDisplay.current.refreshOutputRegion();
  }

  function onClickHandler(event: React.MouseEvent) {
    p.clickHandler(event);
  }

  function createDisplay() {
    const displayId = uuid();
    obsDisplay.current = new OBSDisplay(displayId, {
      sourceId: p.sourceId,
      paddingSize: p.paddingSize,
      paddingColor: v.paddingColor,
      renderingMode: p.renderingMode,
    });
    obsDisplay.current.setShoulddrawUI(p.drawUI);
    obsDisplay.current.onOutputResize(region => p.onOutputResize(region));
    if (displayEl.current) obsDisplay.current.trackElement(displayEl.current);
  }

  function destroyDisplay() {
    if (obsDisplay.current) obsDisplay.current.destroy();
  }

  function updateDisplay() {
    destroyDisplay();
    createDisplay();

    return function cleanup() {
      destroyDisplay();
    };
  }

  return (
    <div
      className="display"
      ref={displayEl}
      style={{ height: '100%', backgroundColor: 'var(--section)', flexGrow: 1 }}
      onClick={onClickHandler}
    />
  );
}
