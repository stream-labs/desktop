import React, { CSSProperties, useMemo } from 'react';
import cx from 'classnames';
import { message } from 'antd';
import Tooltip from 'components-react/shared/Tooltip';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { $t } from 'services/i18n';
import styles from './DisplayToggle.m.less';
import { TDisplayType } from 'services/settings-v2';

interface IDisplayToggle {
  className?: string;
  style?: CSSProperties;
  hasMargin?: boolean;
  display?: TDisplayType;
  setDisplay?: (display: TDisplayType) => void;
}

export default function DisplayToggle(p: IDisplayToggle) {
  const { TransitionsService, StreamingService, DualOutputService } = Services;

  const v = useVuex(() => ({
    horizontalActive: DualOutputService.views.activeDisplays.horizontal,
    verticalActive: DualOutputService.views.activeDisplays.vertical,
    toggleDisplay: DualOutputService.actions.toggleDisplay,
    studioMode: TransitionsService.views.studioMode,
    isMidStreamMode: StreamingService.views.isMidStreamMode,
    showDualOutput: DualOutputService.views.dualOutputMode,
    selectiveRecording: StreamingService.state.selectiveRecording,
  }));

  const controlled = useMemo(() => p.display !== undefined, [p.display]);

  const horizontalActive = useMemo(() => {
    if (controlled) {
      return p.display === 'horizontal';
    }

    return v.horizontalActive;
  }, [v.horizontalActive, controlled]);

  const verticalActive = useMemo(() => {
    if (controlled) {
      return p.display === 'vertical';
    }

    return v.verticalActive && !v.selectiveRecording;
  }, [v.verticalActive, controlled, v.selectiveRecording]);

  const horizontalTooltip = useMemo(() => {
    if (controlled) {
      return $t('Toggle horizontal display.');
    }

    return horizontalActive ? $t('Hide horizontal display.') : $t('Show horizontal display.');
  }, [horizontalActive, controlled]);

  const verticalTooltip = useMemo(() => {
    if (controlled) {
      return $t('Toggle vertical display.');
    }

    return verticalActive ? $t('Hide vertical display.') : $t('Show vertical display.');
  }, [v.verticalActive, controlled]);

  const verticalDisabled = useMemo(() => {
    if (controlled) return false;
    return v.selectiveRecording;
  }, [v.selectiveRecording]);

  function showToggleDisplayErrorMessage() {
    message.error({
      content: $t('Cannot change displays while live.'),
      className: styles.toggleError,
    });
  }

  function showSelectiveRecordingMessage() {
    message.error({
      content: $t('Selective Recording can only be used with horizontal sources.'),
      className: styles.toggleError,
    });
  }

  function toggleDisplay(display: TDisplayType, isActive: boolean) {
    if (controlled && p.setDisplay) {
      p.setDisplay(display);
      return;
    }

    v.toggleDisplay(isActive, display);
  }

  return (
    <div
      className={cx(styles.displayToggleContainer, { [styles.margin]: p.hasMargin })}
      style={p.style}
    >
      <Tooltip
        id="toggle-horizontal-tooltip"
        title={horizontalTooltip}
        className={styles.displayToggle}
        placement="bottomRight"
      >
        <i
          id="horizontal-display-toggle"
          onClick={() => {
            if (!controlled === v.isMidStreamMode) {
              showToggleDisplayErrorMessage();
            } else {
              toggleDisplay('horizontal', !v.horizontalActive);
            }
          }}
          className={cx('icon-desktop icon-button icon-button--lg', {
            active: v.horizontalActive,
          })}
        />
      </Tooltip>

      <Tooltip
        id="toggle-vertical-tooltip"
        title={verticalTooltip}
        className={styles.displayToggle}
        placement="bottomRight"
        disabled={verticalDisabled}
      >
        <i
          id="vertical-display-toggle"
          onClick={() => {
            if (!controlled && v.isMidStreamMode) {
              showToggleDisplayErrorMessage();
            } else if (!controlled && v.selectiveRecording) {
              showSelectiveRecordingMessage();
            } else {
              toggleDisplay('vertical', !v.verticalActive);
            }
          }}
          className={cx('icon-phone-case icon-button icon-button--lg', {
            active: v.verticalActive && !v.selectiveRecording,
            disabled: v.selectiveRecording,
          })}
        />
      </Tooltip>
    </div>
  );
}
