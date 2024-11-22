import { TClip } from 'services/highlighter';
import { SCRUB_HEIGHT, SCRUB_WIDTH, SCRUB_FRAMES } from 'services/highlighter/constants';
import React, { useState } from 'react';
import { Services } from 'components-react/service-provider';
import { BoolButtonInput } from 'components-react/shared/inputs/BoolButtonInput';
import styles from './ClipsView.m.less';
import { Button } from 'antd';
import { $t } from 'services/i18n';
import { isAiClip } from './utils';
import { InputEmojiSection } from './InputEmojiSection';

import { useVuex } from 'components-react/hooks';
export default function ClipPreview(props: {
  clipId: string;
  streamId: string | undefined;
  emitShowTrim: () => void;
  emitShowRemove: () => void;
}) {
  const { HighlighterService } = Services;
  const v = useVuex(() => ({
    clip: HighlighterService.views.clipsDictionary[props.clipId] as TClip,
  }));

  const [scrubFrame, setScrubFrame] = useState<number>(0);

  const clipThumbnail = v.clip.scrubSprite || '';

  // Deleted clips always show as disabled
  const enabled = v.clip.deleted ? false : v.clip.enabled;

  if (!v.clip) {
    return <div>deleted</div>;
  }
  function mouseMove(e: React.MouseEvent) {
    const frameIdx = Math.floor((e.nativeEvent.offsetX / SCRUB_WIDTH) * SCRUB_FRAMES);
    if (scrubFrame !== frameIdx) {
      setScrubFrame(frameIdx);
    }
  }

  function setEnabled(enabled: boolean) {
    HighlighterService.actions.enableClip(v.clip.path, enabled);
  }

  return (
    <div
      className={styles.previewClip}
      style={{
        backgroundColor: '#2B383F',
        borderRadius: '16px',
        display: 'flex',
        gap: '16px',
        opacity: v.clip.enabled ? 1.0 : 0.3,
      }}
    >
      <div style={{ height: `${SCRUB_HEIGHT}px`, position: 'relative' }}>
        {!v.clip.deleted && (
          <img
            src={clipThumbnail}
            style={{
              width: `${SCRUB_WIDTH}px`,
              height: `${SCRUB_HEIGHT}px`,
              objectFit: 'none',
              objectPosition: `-${scrubFrame * SCRUB_WIDTH}px`,
              borderRadius: '10px',
            }}
            onMouseMove={mouseMove}
            onClick={props.emitShowTrim}
          ></img>
        )}
        {v.clip.deleted && (
          <div
            style={{
              width: `${SCRUB_WIDTH}px`,
              height: `${SCRUB_HEIGHT}px`,
              borderRadius: '10px',
              background: 'black',
              verticalAlign: 'middle',
              display: 'inline-block',
              position: 'relative',
            }}
          >
            <i
              className="icon-trash"
              style={{
                position: 'absolute',
                textAlign: 'center',
                width: '100%',
                fontSize: 72,
                top: '27%',
              }}
            />
          </div>
        )}
        <div style={{ position: 'absolute', top: '7px', right: '9px' }}>
          {v.clip.source === 'AiClip' && (
            <FlameHypeScore score={v.clip.aiInfo.score}></FlameHypeScore>
          )}
        </div>
        <span style={{ position: 'absolute', top: '10px', left: '10px' }}>
          <BoolButtonInput
            tooltip={enabled ? $t('Disable clip') : $t('Enable clip')}
            tooltipPlacement="top"
            value={enabled}
            onChange={setEnabled}
            checkboxStyles={{
              width: '24px',
              height: '24px',
              fontSize: '14px',
              background: 'white',
              borderColor: '#333',
            }}
            checkboxActiveStyles={{ background: 'var(--teal-hover)' }}
          />
        </span>
        <div
          className={styles.previewClipMoving}
          style={{
            position: 'absolute',
            bottom: '10px',
            paddingLeft: '10px',
            paddingRight: '10px',
            left: '0',
            width: '320px',
            height: '130px',
            justifyContent: 'end',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
            {' '}
            {/* left */}
            <div
              style={{
                display: 'flex',
              }}
            >
              <span
                style={{
                  padding: '4px 6px',
                  backgroundColor: '#00000070',
                  borderRadius: '4px',
                  color: 'white',
                }}
              >
                {formatSecondsToHMS(v.clip.duration! - (v.clip.startTrim + v.clip.endTrim) || 0)}
              </span>
            </div>
            {/* right */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <div
                style={{
                  fontSize: '19px',
                  transform: 'translateY(1px)',
                }}
              >
                {isAiClip(v.clip) ? (
                  <>
                    <InputEmojiSection
                      clips={[v.clip]}
                      includeRounds={false}
                      includeDeploy={true}
                      showCount={false}
                      showDescription={false}
                    />
                  </>
                ) : (
                  <div style={{}}>
                    <i className="icon-highlighter" />{' '}
                  </div>
                )}
              </div>
              {isAiClip(v.clip) && v.clip.aiInfo?.metadata?.round && (
                <div
                  style={{
                    padding: '4px 6px',
                    backgroundColor: '#00000070',
                    borderRadius: '4px',
                    color: 'white',
                  }}
                >
                  {`Round: ${v.clip.aiInfo.metadata.round}`}
                </div>
              )}
            </div>
          </div>
          <div
            className={styles.previewClipBottomBar}
            style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}
          >
            <Button
              size="large"
              style={{ display: 'flex', gap: '8px', alignItems: 'center', pointerEvents: 'auto' }}
              onClick={props.emitShowRemove}
            >
              <i className="icon-trash" />
            </Button>
            <Button
              size="large"
              style={{ display: 'flex', gap: '8px', alignItems: 'center', pointerEvents: 'auto' }}
              onClick={props.emitShowTrim}
            >
              <i className="icon-trim" /> Trim
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// TODO M: Will be used in next version
function formatSecondsToHHMMSS(seconds: number | undefined): string {
  if (seconds === undefined) {
    return '00:00:00';
  }
  const totalSeconds = Math.round(seconds);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatSecondsToHMS(seconds: number): string {
  const totalSeconds = Math.round(seconds);
  if (totalSeconds === 0) {
    return '0s';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${hours !== 0 ? hours.toString() + 'h ' : ''} ${
    minutes !== 0 ? minutes.toString() + 'm ' : ''
  }${remainingSeconds !== 0 ? remainingSeconds.toString() + 's' : ''}`;
}

function FlameHypeScore({ score }: { score: number }) {
  if (score === undefined) {
    return <></>;
  }
  const normalizedScore = Math.min(1, Math.max(0, score));
  const fullFlames = Math.ceil(normalizedScore * 5);

  return (
    <div className="flex items-center gap-1" style={{ fontSize: '19px' }}>
      {[...Array(fullFlames)].map((_, index) => (
        <React.Fragment key={'on' + index}>🔥</React.Fragment>
      ))}
      {[...Array(5 - fullFlames)].map((_, index) => (
        <span key={'off' + index} style={{ opacity: '0.3' }}>
          🔥
        </span>
      ))}
    </div>
  );
}
