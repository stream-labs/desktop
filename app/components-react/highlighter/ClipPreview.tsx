import { IClip, SCRUB_HEIGHT, SCRUB_WIDTH, SCRUB_FRAMES } from 'services/highlighter';
import React, { useMemo, useState } from 'react';
import path from 'path';
import { Services } from 'components-react/service-provider';
import { BoolButtonInput } from 'components-react/shared/inputs/BoolButtonInput';

export default function ClipPreview(props: { clip: IClip; onClick: () => void }) {
  const { HighlighterService } = Services;
  const [scrubFrame, setScrubFrame] = useState(0);
  const filename = useMemo(() => {
    return path.basename(props.clip.path);
  }, [props.clip.path]);

  function mouseMove(e: React.MouseEvent) {
    const frameIdx = Math.floor((e.nativeEvent.offsetX / SCRUB_WIDTH) * SCRUB_FRAMES);

    if (scrubFrame !== frameIdx) {
      setScrubFrame(frameIdx);
    }
  }

  function setEnabled(enabled: boolean) {
    HighlighterService.actions.enableClip(props.clip.path, enabled);
  }

  return (
    <div style={{ height: `${SCRUB_HEIGHT}px`, position: 'relative' }}>
      <img
        src={props.clip.scrubSprite}
        style={{
          width: `${SCRUB_WIDTH}px`,
          height: `${SCRUB_HEIGHT}px`,
          objectFit: 'none',
          objectPosition: `-${scrubFrame * SCRUB_WIDTH}px`,
          borderRadius: '10px',
          opacity: props.clip.enabled ? 1.0 : 0.3,
        }}
        onMouseMove={mouseMove}
        onClick={props.onClick}
      ></img>
      <span style={{ position: 'absolute', top: '10px', left: '10px' }}>
        <BoolButtonInput
          value={props.clip.enabled}
          onChange={setEnabled}
          checkboxStyles={{
            width: '16px',
            height: '16px',
            fontSize: '10px',
            background: 'white',
            borderColor: '#333',
          }}
          checkboxActiveStyles={{ background: 'var(--teal-hover)' }}
        />
      </span>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          width: '100%',
          padding: '0 10px',
          borderRadius: '0 0 10px 10px',
        }}
      >
        {filename}
      </div>
    </div>
  );
}
