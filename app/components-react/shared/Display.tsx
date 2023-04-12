import React, { useEffect, useRef } from 'react';
import { useVuex } from '../hooks';
import { Services } from '../service-provider';
import { Display as OBSDisplay } from '../../services/video';
import { TDisplayType } from 'services/settings-v2/video';
import uuid from 'uuid/v4';
interface DisplayProps {
  sourceId?: string;
  paddingSize?: number;
  drawUI?: boolean;
  renderingMode?: number;
  onOutputResize?: (region: IRectangle) => void;
  clickHandler?: (event: React.MouseEvent) => void;
  style?: React.CSSProperties;
  type?: TDisplayType;
}

export default function Display(props: DisplayProps) {
  const { CustomizationService, VideoSettingsService } = Services;

  const p = {
    paddingSize: 0,
    drawUI: false,
    clickHandler: () => {},
    onOutputResize: () => {},
    ...props,
  };

  const v = useVuex(() => {
    const videoSettings = VideoSettingsService.contexts[p.type ?? 'horizontal']?.video;

    return {
      paddingColor: CustomizationService.views.displayBackground,
      baseResolution: `${videoSettings?.baseWidth}x${videoSettings?.baseHeight}`,
    };
  }, false);

  const obsDisplay = useRef<OBSDisplay | null>(null);
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
      type: p.type,
    });
    obsDisplay.current.setShoulddrawUI(p.drawUI);
    obsDisplay.current.onOutputResize(region => p.onOutputResize(region));
    if (displayEl.current) obsDisplay.current.trackElement(displayEl.current);
  }

  function destroyDisplay() {
    if (obsDisplay.current) obsDisplay.current.destroy();
    obsDisplay.current = null;
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
      style={{
        height: '100%',
        backgroundColor: 'var(--section)',
        flexGrow: 1,
        ...p.style,
      }}
      onClick={onClickHandler}
    />
  );
}
