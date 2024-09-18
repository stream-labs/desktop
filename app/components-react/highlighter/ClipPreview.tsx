import { IAiClip, TClip } from 'services/highlighter';
import { SCRUB_HEIGHT, SCRUB_WIDTH, SCRUB_FRAMES } from 'services/highlighter/constants';
import React, { useMemo, useState } from 'react';
import path from 'path';
import { Services } from 'components-react/service-provider';
import { BoolButtonInput } from 'components-react/shared/inputs/BoolButtonInput';
import styles from './ClipsView.m.less';
import cx from 'classnames';
import { Button, Tooltip } from 'antd';
import { $t } from 'services/i18n';
import { isAiClip } from './utils';

export default function ClipPreview(props: {
  clip: TClip;
  showTrim: () => void;
  showRemove: () => void;
}) {
  const { HighlighterService } = Services;
  const [scrubFrame, setScrubFrame] = useState(0);

  // TODO: placeholder image + make sure to regenerate sprite if sprite doesnt exist
  let clipThumbnail = '';
  if (props.clip.scrubSprite && HighlighterService.fileExists(props.clip.scrubSprite)) {
    clipThumbnail = props.clip.scrubSprite;
  } else {
    clipThumbnail = '';
  }

  const filename = useMemo(() => {
    return path.basename(props.clip.path);
  }, [props.clip.path]);
  // Deleted clips always show as disabled
  const enabled = props.clip.deleted ? false : props.clip.enabled;

  function mouseMove(e: React.MouseEvent) {
    const frameIdx = Math.floor((e.nativeEvent.offsetX / SCRUB_WIDTH) * SCRUB_FRAMES);

    if (scrubFrame !== frameIdx) {
      setScrubFrame(frameIdx);
    }
  }

  function setEnabled(enabled: boolean) {
    HighlighterService.actions.enableClip(props.clip.path, enabled);
  }

  function getInitialTime() {
    if (!props.clip.streamInfo) {
      return 'noStreamInfo';
    }

    const streamIds = Object.keys(props.clip.streamInfo);
    if (streamIds.length === 0) {
      return 'noStreamId';
    }

    const firstStreamId = streamIds[0]; // TODO M: Pass streamId here? or need to find the stream where the initialTime is not undefined
    const startTime = props.clip.streamInfo[firstStreamId]?.initialStartTime;
    const endTime = props.clip.streamInfo[firstStreamId]?.initialEndTime;

    return startTime !== undefined ? `${startTime} -${endTime}  ` : 'startTimeUndefined';
  }
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#2B383F',
        borderRadius: '16px',
        display: 'flex',
        gap: '16px',
      }}
    >
      <div style={{ height: `${SCRUB_HEIGHT}px`, position: 'relative' }}>
        {!props.clip.deleted && (
          <img
            src={clipThumbnail}
            style={{
              width: `${SCRUB_WIDTH}px`,
              height: `${SCRUB_HEIGHT}px`,
              objectFit: 'none',
              objectPosition: `-${scrubFrame * SCRUB_WIDTH}px`,
              borderRadius: '10px',
              opacity: props.clip.enabled ? 1.0 : 0.3,
            }}
            onMouseMove={mouseMove}
            onClick={props.showTrim}
          ></img>
        )}
        {props.clip.deleted && (
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
        {/* <div
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            fontSize: 18,
            padding: '2px 8px 0',
            borderRadius: '5px',
            background: 'rgba(0,0,0,0.5)',
            color: 'var(--highlighter-icon)',
          }}
        >
          <Tooltip title={$t('Trim clip')} placement="top">
            <i
              className={cx('icon-studio-mode-3', styles.clipAction)}
              style={{ marginRight: 12 }}
              onClick={props.showTrim}
            />
          </Tooltip>
          <Tooltip title={$t('Remove clip')} placement="top">
            <i className={cx('icon-trash', styles.clipAction)} onClick={props.showRemove} />
          </Tooltip>
        </div> */}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0 10px',
          borderRadius: '0 0 10px 10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex' }}>
            <div
              style={{
                fontSize: '16px',
                width: '240px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {props.clip.path}
            </div>
            <div style={{}}>
              {isAiClip(props.clip) ? props.clip.aiInfo.moments[0].type : 'ReplayBuffer'}
            </div>
          </div>
          <div>94/100</div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '16px' }}>1:23:11 - 1:24:42</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {' '}
            <Button
              size="large"
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              onClick={props.showRemove}
            >
              <i className="icon-trash" />
            </Button>
            <Button
              size="large"
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              onClick={props.showTrim}
            >
              <i className="icon-trim" /> Trim
            </Button>
            <Button
              size="large"
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              onClick={() => {}}
            >
              <i className="icon-crossclip" /> Export vertical
            </Button>
            <Button
              size="large"
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              onClick={() => {}}
            >
              <i className="icon-download" /> Export clip
            </Button>
            {/* <Tooltip title={$t('Trim clip')} placement="top">
              <i
                className={cx('icon-studio-mode-3', styles.clipAction)}
                style={{ marginRight: 12 }}
                onClick={props.showTrim}
              />
            </Tooltip> */}
            {/* <Tooltip title={$t('Remove clip')} placement="top">
              <i className={cx('icon-trash', styles.clipAction)} onClick={props.showRemove} />
            </Tooltip> */}
          </div>
        </div>
        {/* {`${props.clip.deleted ? '[DELETED] ' : ''}${filename}`} */}
      </div>
    </div>
  );
}
