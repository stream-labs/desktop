import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import React from 'react';
import { TClip } from 'services/highlighter';
import { SCRUB_HEIGHT, SCRUB_WIDTH } from 'services/highlighter/constants';

export default function MiniClipPreview({ clipId }: { clipId: string }) {
  const { HighlighterService } = Services;
  const clip = useVuex(() => HighlighterService.views.clipsDictionary[clipId] as TClip);
  return (
    <div
      key={clip.path}
      style={{
        display: clip.enabled ? 'inline-block' : 'none',
        borderRadius: '4px',
        border: `solid ${clip.enabled ? '2px' : '0px'}  transparent`,
      }}
    >
      <img
        src={clip.scrubSprite}
        style={{
          width: `${SCRUB_WIDTH / 6}px`,
          height: `${SCRUB_HEIGHT / 6}px`,
          objectFit: 'cover',
          objectPosition: 'left top',
          borderRadius: '4px',
        }}
      ></img>
    </div>
  );
}
