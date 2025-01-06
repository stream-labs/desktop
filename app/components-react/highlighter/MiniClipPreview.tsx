import { useVuex } from 'components-react/hooks';
import Highlighter from 'components-react/pages/Highlighter';
import { Services } from 'components-react/service-provider';
import { BoolButtonInput } from 'components-react/shared/inputs';
import { SwitchInput } from 'components-react/shared/inputs/SwitchInput';
import React from 'react';
import { TClip } from 'services/highlighter';
import { SCRUB_HEIGHT, SCRUB_WIDTH } from 'services/highlighter/constants';
import { $t } from 'services/i18n';

export default function MiniClipPreview({
  clipId,
  toggleAble,
  clipStateChanged,
}: {
  clipId: string;
  toggleAble: boolean;
  clipStateChanged: (clipId: string, newState: boolean) => void;
}) {
  const { HighlighterService } = Services;
  const clip = useVuex(() => HighlighterService.views.clipsDictionary[clipId] as TClip);
  return (
    <div
      key={clip.path}
      style={{
        position: 'relative',
        display: clip.enabled || toggleAble ? 'inline-block' : 'none',
        opacity: !clip.enabled && toggleAble ? '0.3' : '1',
        borderRadius: '4px',
        border: `solid ${clip.enabled ? '2px' : '0px'}  transparent`,
      }}
    >
      {toggleAble && (
        <BoolButtonInput
          tooltip={clip.enabled ? $t('Disable clip') : $t('Enable clip')}
          tooltipPlacement="top"
          value={clip.enabled}
          onChange={() => {
            const newState = !clip.enabled;
            HighlighterService.actions.enableClip(clip.path, newState);
            clipStateChanged(clip.path, newState);
          }}
          checkboxStyles={{
            width: '24px',
            height: '24px',
            fontSize: '14px',
            background: 'white',
            borderColor: '#333',
            position: 'absolute',
            left: '4px',
            top: '4px',
            padding: 0,
            margin: 0,
          }}
          checkboxActiveStyles={{ background: 'var(--teal-hover)' }}
        />
      )}
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
