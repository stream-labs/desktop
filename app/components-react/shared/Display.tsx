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

  const v = useVuex(() => ({
    paddingColor: CustomizationService.views.displayBackground,
    baseResolution: VideoService.baseResolution,
  }));

  const obsDisplay = useRef<OBSDisplay>();
  const displayEl = useRef<HTMLDivElement>(null);

  useEffect(lifecycle, []);

  function lifecycle() {
    // componentDidMount
    createDisplay();

    // componentWillUnmount
    return function cleanup() {
      destroyDisplay();
    };
  }

  const watchers = useRef({
    sourceId: p.sourceId,
    paddingColor: v.paddingColor,
    baseResolution: v.baseResolution,
  });
  if (watchers.current.sourceId !== p.sourceId) {
    watchers.current.sourceId = p.sourceId;
    updateDisplay();
  }
  if (watchers.current.paddingColor !== v.paddingColor) {
    watchers.current.paddingColor = v.paddingColor;
    updateDisplay();
  }
  if (watchers.current.baseResolution !== v.baseResolution) {
    watchers.current.baseResolution = v.baseResolution;
    if (obsDisplay.current) obsDisplay.current.refreshOutputRegion();
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
