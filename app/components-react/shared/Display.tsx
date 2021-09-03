import React, { CSSProperties, useEffect, useRef } from 'react';
import { useVuex } from '../hooks';
import { Services } from '../service-provider';
import { Display as OBSDisplay } from '../../services/video';
import uuid from 'uuid/v4';
import { getDefined } from '../../util/properties-type-guards';

interface DisplayProps {
  sourceId?: string;
  paddingSize?: number;
  drawUI?: boolean;
  renderingMode?: number;
  onOutputResize?: (region: IRectangle) => void;
  clickHandler?: (event: React.MouseEvent) => void;
  isVisible?: boolean;
}

export default function Display(props: DisplayProps) {
  const { VideoService, CustomizationService, SourcesService } = Services;

  const p = {
    paddingSize: 0,
    drawUI: false,
    clickHandler: () => {},
    onOutputResize: () => {},
    isVisible: true,
    ...props,
  };

  const v = useVuex(() => {
    const { width, height } = p.sourceId
      ? getDefined(SourcesService.views.getSource(p.sourceId))
      : { width: 0, height: 0 };

    return {
      paddingColor: CustomizationService.views.displayBackground,
      baseResolution: VideoService.baseResolution,
      width,
      height,
    };
  }, false);

  const obsDisplay = useRef<OBSDisplay>();
  const displayEl = useRef<HTMLDivElement>(null);

  useEffect(updateDisplay, [p.sourceId, v.paddingColor, p.isVisible]);
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
    if (p.isVisible) createDisplay();

    return function cleanup() {
      destroyDisplay();
    };
  }

  const blackRectSvg = `          <svg viewBox="auto auto">
            <rect width="${v.width}" height="${v.height}" style="fill:rgb(0,0,0);" />
          </svg>`;

  const width = v.width > v.height ? '100%' : `${(v.width / v.height) * 100}px`;
  const height = v.width > v.height ? `${(v.height / v.width) * 100}px` : '100%';

  const fakeDisplayStyle = ({
    backgroundColor: 'black',
    // width: `${v.width}px`,
    // height: `${v.height}px`,
    // objectFit: 'scale-down',
    '--aspect-ratio': `${v.width}/${v.height}`,
  } as unknown) as CSSProperties;

  if (v.width > v.height) {
    fakeDisplayStyle.width = '100%';
  } else {
    fakeDisplayStyle.height = '100%';
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {p.isVisible && (
        <div
          className="display"
          ref={displayEl}
          style={{ height: '100%', backgroundColor: 'var(--section)', flexGrow: 1 }}
          onClick={onClickHandler}
        />
      )}

      <div
        className="display"
        style={{
          position: 'absolute',
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
          backgroundColor: 'var(--section)',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={fakeDisplayStyle} />
      </div>
    </div>
  );
}
