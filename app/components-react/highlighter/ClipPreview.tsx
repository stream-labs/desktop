import { IClip } from 'services/highlighter';
import { SCRUB_HEIGHT, SCRUB_WIDTH, SCRUB_FRAMES } from 'services/highlighter/constants';
import React, { useMemo, useState } from 'react';
import path from 'path';
import { Services } from 'components-react/service-provider';
import { BoolButtonInput } from 'components-react/shared/inputs/BoolButtonInput';
import styles from '../pages/Highlighter.m.less';
import cx from 'classnames';
import { Tooltip } from 'antd';
import { $t } from 'services/i18n';

export default function ClipPreview(props: {
  clip: IClip;
  showTrim: () => void;
  showRemove: () => void;
}) {
  const { HighlighterService } = Services;
  const [scrubFrame, setScrubFrame] = useState(0);
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

  return (
    <div style={{ height: `${SCRUB_HEIGHT}px`, position: 'relative' }}>
      {!props.clip.deleted && (
        <img
          src={props.clip.scrubSprite?.replace('#', '%23')}
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
      <div
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
        {/* TODO: Let's not use the same icon as studio mode */}
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
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          width: '100%',
          padding: '0 10px',
          borderRadius: '0 0 10px 10px',
          color: 'var(--highlighter-icon)',
        }}
      >
        {`${props.clip.deleted ? '[DELETED] ' : ''}${filename}`}
      </div>
    </div>
  );
}
