import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import { EStreamQuality } from '../../services/performance';
import { EStreamingState, EReplayBufferState, ERecordingState } from '../../services/streaming';
import { Services } from '../service-provider';
import { $t } from '../../services/i18n';
import { useVuex } from '../hooks';
import styles from './StudioFooter.m.less';
import PerformanceMetrics from '../shared/PerformanceMetrics';
import TestWidgets from './TestWidgets';
import StartStreamingButton from './StartStreamingButton';
import NotificationsArea from './NotificationsArea';
import { Tooltip } from 'antd';
import { confirmAsync } from 'components-react/modals';
import { useModule } from 'components-react/hooks/useModule';

export default function StudioFooterComponent() {
  const {
    StreamingService,
    WindowsService,
    YoutubeService,
    UsageStatisticsService,
    NavigationService,
    RecordingModeService,
  } = Services;

  const {
    streamingStatus,
    platform,
    streamQuality,
    isLoggedIn,
    canSchedule,
    replayBufferOffline,
    replayBufferStopping,
    replayBufferSaving,
    youtubeEnabled,
    recordingModeEnabled,
    replayBufferEnabled,
  } = useModule(FooterModule).select();

  useEffect(confirmYoutubeEnabled, [platform]);

  function performanceIconClassName() {
    if (!streamingStatus || streamingStatus === EStreamingState.Offline) {
      return '';
    }

    if (streamingStatus === EStreamingState.Reconnecting || streamQuality === EStreamQuality.POOR) {
      return 'warning';
    }

    if (streamQuality === EStreamQuality.FAIR) {
      return 'info';
    }

    return 'success';
  }

  function confirmYoutubeEnabled() {
    if (platform === 'youtube') {
      YoutubeService.actions.prepopulateInfo();
    }
  }

  function openYoutubeEnable() {
    YoutubeService.actions.openYoutubeEnable();
  }

  function openScheduleStream() {
    NavigationService.actions.navigate('StreamScheduler');
  }

  function openMetricsWindow() {
    WindowsService.actions.showWindow({
      componentName: 'AdvancedStatistics',
      title: $t('Performance Metrics'),
      size: { width: 700, height: 550 },
      resizable: true,
      maximizable: false,
      minWidth: 500,
      minHeight: 400,
    });
    UsageStatisticsService.actions.recordFeatureUsage('PerformanceStatistics');
  }

  function toggleReplayBuffer() {
    if (StreamingService.state.replayBufferStatus === EReplayBufferState.Offline) {
      StreamingService.actions.startReplayBuffer();
    } else {
      StreamingService.actions.stopReplayBuffer();
    }
  }

  function saveReplay() {
    if (replayBufferSaving || replayBufferStopping) return;
    StreamingService.actions.saveReplay();
  }

  async function showRecordingModeDisableModal() {
    const result = await confirmAsync({
      title: $t('Enable Live Streaming?'),
      content: (
        <p>
          {$t(
            'Streamlabs is currently in recording mode, which hides live streaming features. Would you like to enable live streaming features? You can disable them again in General settings.',
          )}
        </p>
      ),
      okText: $t('Enable Streaming'),
    });

    if (result) {
      RecordingModeService.actions.setRecordingMode(false);
    }
  }

  return (
    <div className={cx('footer', styles.footer)}>
      <div className={cx('flex flex--center flex--grow flex--justify-start', styles.footerLeft)}>
        {isLoggedIn && platform === 'youtube' && !youtubeEnabled && (
          <div className={styles.errorWrapper}>
            <div className={styles.platformError}>
              <i className="fa fa-exclamation-triangle" />
              <span>{$t('YouTube account not enabled for live streaming')}</span>
              <button className="button alert-button" onClick={openYoutubeEnable}>
                {$t('Fix')}
              </button>
              <button className="button alert-button" onClick={confirmYoutubeEnabled}>
                {$t("I'm set up")}
              </button>
            </div>
          </div>
        )}
        <Tooltip placement="left" title={$t('Open Performance Window')}>
          <i
            className={cx(
              'icon-leaderboard-4',
              'metrics-icon',
              styles.metricsIcon,
              performanceIconClassName(),
            )}
            onClick={openMetricsWindow}
          />
        </Tooltip>
        <PerformanceMetrics mode="limited" className="performance-metrics" />
        <NotificationsArea />
      </div>

      <div className={styles.navRight}>
        <div className={styles.navItem}>{isLoggedIn && <TestWidgets />}</div>
        {recordingModeEnabled && (
          <button className="button button--trans" onClick={showRecordingModeDisableModal}>
            {$t('Looking to stream?')}
          </button>
        )}
        {!recordingModeEnabled && <RecordingButton />}
        {replayBufferEnabled && replayBufferOffline && (
          <div className={styles.navItem}>
            <Tooltip placement="left" title={$t('Start Replay Buffer')}>
              <button className="circle-button" onClick={toggleReplayBuffer}>
                <i className="icon-replay-buffer" />
              </button>
            </Tooltip>
          </div>
        )}
        {!replayBufferOffline && (
          <div className={cx(styles.navItem, styles.replayButtonGroup)}>
            <Tooltip placement="left" title={$t('Stop')}>
              <button
                className={cx('circle-button', styles.leftReplay, 'button--soft-warning')}
                onClick={toggleReplayBuffer}
              >
                {replayBufferStopping ? (
                  <i className="fa fa-spinner fa-pulse" />
                ) : (
                  <i className="fa fa-stop" />
                )}
              </button>
            </Tooltip>
            <Tooltip placement="right" title={$t('Save Replay')}>
              <button className={cx('circle-button', styles.rightReplay)} onClick={saveReplay}>
                {replayBufferSaving ? (
                  <i className="fa fa-spinner fa-pulse" />
                ) : (
                  <i className="icon-save" />
                )}
              </button>
            </Tooltip>
          </div>
        )}
        {canSchedule && (
          <div className={styles.navItem}>
            <Tooltip placement="left" title={$t('Schedule Stream')}>
              <button className="circle-button" onClick={openScheduleStream}>
                <i className="icon-date" />
              </button>
            </Tooltip>
          </div>
        )}
        {!recordingModeEnabled && (
          <div className={styles.navItem}>
            <StartStreamingButton />
          </div>
        )}
        {recordingModeEnabled && <RecordingButton />}
      </div>
    </div>
  );
}

function RecordingButton() {
  const { StreamingService } = Services;
  const { isRecording, recordingStatus } = useVuex(() => ({
    isRecording: StreamingService.views.isRecording,
    recordingStatus: StreamingService.state.recordingStatus,
  }));

  function toggleRecording() {
    StreamingService.actions.toggleRecording();
  }

  return (
    <>
      <RecordingTimer />
      <div className={styles.navItem}>
        <Tooltip
          placement="left"
          title={isRecording ? $t('Stop Recording') : $t('Start Recording')}
        >
          <button
            className={cx(styles.recordButton, 'record-button', { active: isRecording })}
            onClick={toggleRecording}
          >
            <span>
              {recordingStatus === ERecordingState.Stopping ? (
                <i className="fa fa-spinner fa-pulse" />
              ) : (
                <>REC</>
              )}
            </span>
          </button>
        </Tooltip>
      </div>
    </>
  );
}

function RecordingTimer() {
  const { StreamingService } = Services;
  const [recordingTime, setRecordingTime] = useState('');

  const { isRecording } = useVuex(() => ({
    isRecording: StreamingService.views.isRecording,
  }));

  useEffect(() => {
    if (isRecording) {
      const recordingTimeout = window.setTimeout(() => {
        setRecordingTime(StreamingService.formattedDurationInCurrentRecordingState);
      }, 1000);

      return () => clearTimeout(recordingTimeout);
    }
  }, [isRecording, recordingTime]);

  if (!isRecording) return <></>;
  return <div className={cx(styles.navItem, styles.recordTime)}>{recordingTime}</div>;
}

class FooterModule {
  state = {};

  get replayBufferEnabled() {
    return Services.SettingsService.views.values.Output.RecRB;
  }

  get streamingStatus() {
    return Services.StreamingService.views.streamingStatus;
  }

  get platform() {
    return Services.UserService.views.platform?.type;
  }

  get streamQuality() {
    return Services.PerformanceService.views.streamQuality;
  }

  get isLoggedIn() {
    return Services.UserService.views.isLoggedIn;
  }

  get canSchedule() {
    return (
      Services.StreamingService.views.supports('stream-schedule') &&
      !Services.RecordingModeService.views.isRecordingModeEnabled
    );
  }

  get replayBufferOffline() {
    return Services.StreamingService.state.replayBufferStatus === EReplayBufferState.Offline;
  }

  get replayBufferStopping() {
    return Services.StreamingService.state.replayBufferStatus === EReplayBufferState.Stopping;
  }

  get replayBufferSaving() {
    return Services.StreamingService.state.replayBufferStatus === EReplayBufferState.Saving;
  }

  get youtubeEnabled() {
    return Services.YoutubeService.state.liveStreamingEnabled;
  }

  get recordingModeEnabled() {
    return Services.RecordingModeService.views.isRecordingModeEnabled;
  }
}
