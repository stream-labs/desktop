import React from 'react';
import { TClip } from 'services/highlighter';
import { isAiClip } from './utils';

export function InputEmojiSection({ clips }: { clips: TClip[] }): JSX.Element {
  const inputTypeMap = Object.entries(getMomentTypeCount(clips));
  const filteredinputTypeMap =
    inputTypeMap.length > 3 ? inputTypeMap.filter(([type]) => type !== 'deploy') : inputTypeMap;
  const manualClips = clips.filter(
    clip => clip.source === 'ReplayBuffer' || clip.source === 'Manual',
  );

  function manualClip() {
    if (manualClips.length === 0) {
      return <></>;
    }
    return (
      <div key={'manualClips'} style={{ display: 'flex', gap: '4px' }}>
        <span>🎬</span>
        <span>{`${manualClips.length} ${manualClips.length === 1 ? ' manual' : ' manual'}`}</span>
      </div>
    );
  }

  return (
    <div style={{ height: '22px', display: 'flex', gap: '12px' }}>
      {filteredinputTypeMap.map(([type, count]) => (
        <div key={type} style={{ display: 'flex', gap: '4px' }}>
          <span key={type + 'emoji'}>{getTypeWordingFromType(type).emoji} </span>{' '}
          <span key={type + 'desc'}>
            {' '}
            {count} {getTypeWordingFromType(type).description}
          </span>
        </div>
      ))}
      {manualClip()}
      {inputTypeMap.length > 3 ? '...' : ''}
    </div>
  );
}
function getTypeWordingFromType(type: string): { emoji: string; description: string } {
  switch (type) {
    case 'kill':
      return { emoji: '💀', description: 'eliminated' };
    case 'knocked':
      return { emoji: '🥊', description: 'knocked' };
    case 'death':
      return { emoji: '🪦', description: 'deaths' };
    case 'victory':
      return { emoji: '🏆', description: 'win' };
    case 'deploy':
      return { emoji: '🪂', description: 'deploy' };

    default:
      break;
  }
  return { emoji: type, description: type };
}

function getMomentTypeCount(clips: TClip[]): { [type: string]: number } {
  const typeCounts: { [type: string]: number } = {};

  clips.forEach(clip => {
    if (isAiClip(clip)) {
      clip.aiInfo.moments.forEach(moment => {
        const type = moment.type;
        if (typeCounts[type]) {
          typeCounts[type] += 1;
        } else {
          typeCounts[type] = 1;
        }
      });
    }
  });

  return typeCounts;
}
