import React from 'react';
import { IAiClip, IDeathMetadata, IInput, IKillMetadata, TClip } from 'services/highlighter';
import { isAiClip } from './utils';
import { EHighlighterInputTypes } from 'services/highlighter/ai-highlighter/ai-highlighter';
import styles from './InputEmojiSection.m.less';

interface TypeWording {
  emoji: string;
  description: string;
}
const TYPE_WORDING_MAP: Record<string, (count: number) => TypeWording> = {
  [EHighlighterInputTypes.KILL]: count => ({
    emoji: '🔫',
    description: count > 1 ? 'eliminations' : 'elimination',
  }),
  [EHighlighterInputTypes.KNOCKED]: count => ({
    emoji: '🥊',
    description: count > 1 ? 'knocks' : 'knocked',
  }),
  [EHighlighterInputTypes.DEATH]: count => ({
    emoji: '🪦',
    description: count > 1 ? 'deaths' : 'death',
  }),
  [EHighlighterInputTypes.VICTORY]: count => ({
    emoji: '🏆',
    description: count > 1 ? 'wins' : 'win',
  }),
  [EHighlighterInputTypes.DEPLOY]: count => ({
    emoji: '🪂',
    description: count > 1 ? 'deploys' : 'deploy',
  }),
  [EHighlighterInputTypes.PLAYER_KNOCKED]: () => ({
    emoji: '😵',
    description: 'got knocked',
  }),
  BOT_KILL: count => ({
    emoji: '🤖',
    description: count > 1 ? 'bot eliminations' : 'bot elimination',
  }),
  rounds: count => ({
    emoji: '🏁',
    description: count === 0 || count > 1 ? `rounds ${count === 0 ? 'detected' : ''}` : 'round',
  }),
};

function getTypeWordingFromType(
  type: string,
  count: number,
): { emoji: string; description: string } {
  return TYPE_WORDING_MAP[type]?.(count) ?? { emoji: '', description: '?' };
}

function getInputTypeCount(clips: TClip[]): { [type: string]: number } {
  const typeCounts: { [type: string]: number } = {};
  if (clips.length === 0) {
    return typeCounts;
  }
  clips.forEach(clip => {
    if (isAiClip(clip)) {
      clip.aiInfo.inputs?.forEach(input => {
        const type = input.type;
        if (type === EHighlighterInputTypes.KILL) {
          if ((input?.metadata as IKillMetadata)?.bot_kill === true) {
            const currentCount = typeCounts['BOT_KILL'];
            typeCounts['BOT_KILL'] = currentCount ? currentCount + 1 : 1;
            return;
          }
        }
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
function isDeath(type: string): boolean {
  return type === EHighlighterInputTypes.DEATH;
}

function getGamePlacement(clips: TClip[]): number | null {
  const deathClip = clips.find(
    clip =>
      isAiClip(clip) &&
      clip.aiInfo.inputs.some(input => input.type === EHighlighterInputTypes.DEATH),
  ) as IAiClip;

  return getPlacementFromInputs(deathClip.aiInfo.inputs);
}
function getAmountOfRounds(clips: TClip[]): number {
  const rounds: number[] = [];
  clips.filter(isAiClip).forEach(clip => {
    rounds.push(clip.aiInfo.metadata?.round || 1);
  });
  return Math.max(0, ...rounds);
}

export function getPlacementFromInputs(inputs: IInput[]): number | null {
  const deathInput = inputs.find(input => input.type === EHighlighterInputTypes.DEATH);
  return (deathInput?.metadata as IDeathMetadata)?.place || null;
}

export function InputEmojiSection({
  clips,
  includeRounds,
  includeDeploy,
  showCount,
  showDescription,
}: {
  clips: TClip[];
  includeRounds: boolean;
  includeDeploy: boolean;
  showCount?: boolean;
  showDescription?: boolean;
}): JSX.Element {
  const excludeTypes = [
    EHighlighterInputTypes.GAME_SEQUENCE,
    EHighlighterInputTypes.GAME_START,
    EHighlighterInputTypes.GAME_END,
    EHighlighterInputTypes.VOICE_ACTIVITY,
    EHighlighterInputTypes.META_DURATION,
    EHighlighterInputTypes.LOW_HEALTH,
  ];

  const inputTypeMap = Object.entries(getInputTypeCount(clips));
  const filteredInputTypeMap = inputTypeMap.filter(
    ([type]) =>
      !excludeTypes.includes(type as EHighlighterInputTypes) &&
      (inputTypeMap.length <= 2 || includeDeploy || type !== 'deploy'),
  );

  return (
    <div
      style={{ height: '22px', display: 'flex', gap: '8px', flexWrap: 'wrap', overflow: 'hidden' }}
    >
      {includeRounds && <RoundTag clips={clips} />}
      {filteredInputTypeMap.map(([type, count]) => (
        <AiMomentTag
          key={type + 'emoji'}
          type={type}
          count={count}
          clips={clips}
          showCount={showCount}
          showDescription={showDescription}
        />
      ))}
      <ManualClipTag clips={clips} />
      {inputTypeMap.length > 3 ? '...' : ''}
    </div>
  );
}

export function RoundTag({ clips }: { clips: TClip[] }): JSX.Element {
  const rounds = getAmountOfRounds(clips);
  const { emoji, description } = getTypeWordingFromType('rounds', rounds);
  return (
    <div key={'rounds'} style={{ display: 'flex', gap: '4px' }}>
      <span key={'rounds-emoji'}> {emoji} </span>{' '}
      <span className={styles.description} key={'rounds-description'}>
        {rounds} {description}
      </span>
    </div>
  );
}

export function AiMomentTag({
  type,
  count,
  clips,
  showCount,
  showDescription,
  includeRounds,
}: {
  type: string;
  count: number;
  clips: TClip[];
  showCount?: boolean;
  showDescription?: boolean;
  includeRounds?: boolean;
}): JSX.Element {
  const { emoji, description } = getTypeWordingFromType(type, count);
  return (
    <div key={type} style={{ display: 'flex', gap: '4px' }}>
      <span key={type + 'emoji'}>{emoji} </span>
      {(showCount !== false || showDescription !== false) && (
        <span className={styles.description} key={type + 'description'}>
          {showCount !== false && `${count} `}
          {showDescription !== false && description}
          {!includeRounds && isDeath(type) && getGamePlacement(clips)
            ? '#' + getGamePlacement(clips)
            : ''}
        </span>
      )}
    </div>
  );
}

export function ManualClipTag({ clips }: { clips: TClip[] }): JSX.Element {
  const manualClips = clips.filter(
    clip => clip.source === 'ReplayBuffer' || clip.source === 'Manual',
  );
  if (manualClips.length === 0) {
    return <></>;
  }
  return (
    <div key={'manualClips'} style={{ display: 'flex', gap: '4px' }}>
      <span>🎬</span>
      <span className={styles.description}>{`${manualClips.length} ${
        manualClips.length === 1 ? 'manual' : 'manuals'
      }`}</span>
    </div>
  );
}
