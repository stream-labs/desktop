import { useGoLiveSettings } from './go-live';
import css from './GoLiveChecklist.m.less';
import React, { HTMLAttributes } from 'react';
import { useOnCreate, useVuex } from '../../hooks';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
import { TGoLiveChecklistItemState } from '../../../services/streaming';
import cx from 'classnames';
import GoLiveError from './GoLiveError';
import MessageLayout from './MessageLayout';
import { Timeline } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';

/**
 * Shows transition to live progress and helps troubleshoot related problems
 */
export default function GoLiveChecklist(p: HTMLAttributes<unknown>) {
  const { StreamingService, VideoEncodingOptimizationService, TwitterService } = Services;
  const {
    error,
    enabledPlatforms,
    lifecycle,
    isMultiplatformMode,
    shouldShowOptimizedProfile,
    shouldPostTweet,
    checklist,
    delayEnabled,
    warning,
    getPlatformDisplayName,
    isUpdateMode,
  } = useGoLiveSettings('GoLiveChecklist', view => ({
    shouldShowOptimizedProfile:
      VideoEncodingOptimizationService.state.useOptimizedProfile && view.isMidStreamMode,
    shouldPostTweet: !view.isUpdateMode && TwitterService.state.tweetWhenGoingLive,
    delayEnabled: StreamingService.delayEnabled,
  }));

  const success = lifecycle === 'live';

  useOnCreate(() => {
    // TODO:
    // if (!rs.delayEnabled) return;
    // const updateDelaySecondsRemaining = () => {
    //   this.delaySecondsRemaining = this.streamingService.delaySecondsRemaining;
    //   setTimeout(() => {
    //     updateDelaySecondsRemaining();
    //   }, 1000);
    // };
    // updateDelaySecondsRemaining();
  });

  function render() {
    return (
      <div className={cx(css.container, p.className, { [css.success]: success })}>
        <h1 className={css.success}>{getHeaderText()}</h1>

        <Timeline>
          {/* PLATFORMS UPDATE */}
          {enabledPlatforms.map(platform =>
            renderCheck(
              $t('Update settings for %{platform}', {
                platform: getPlatformDisplayName(platform),
              }),
              checklist[platform],
            ),
          )}

          {/* RESTREAM */}
          {!isUpdateMode &&
            isMultiplatformMode &&
            renderCheck($t('Configure the Multistream service'), checklist.setupMultistream)}

          {/* OPTIMIZED PROFILE */}
          {shouldShowOptimizedProfile &&
            renderCheck($t('Apply optimized settings'), checklist.applyOptimizedSettings)}

          {/* START TRANSMISSION */}
          {!isUpdateMode &&
            renderCheck($t('Start video transmission'), checklist.startVideoTransmission, {
              renderStreamDelay: delayEnabled,
            })}

          {/* POST A TWEET */}
          {shouldPostTweet && renderCheck($t('Post a tweet'), checklist.postTweet)}
        </Timeline>

        {/* WARNING MESSAGE */}
        {warning === 'YT_AUTO_START_IS_DISABLED' && renderYtWarning()}

        {/* ERROR MESSAGE */}
        <GoLiveError />
      </div>
    );
  }

  function getHeaderText() {
    if (error) {
      if (checklist.startVideoTransmission === 'done') {
        return $t('Your stream has started, but there were issues with other actions taken');
      } else {
        return $t('Something went wrong');
      }
    }
    if (lifecycle === 'live') {
      return $t("You're live!");
    }
    return $t('Working on your live stream') + '...';
  }

  function renderCheck(
    title: string,
    state: TGoLiveChecklistItemState,
    modificators?: { renderStreamDelay?: boolean },
  ) {
    let dot;
    let color;
    switch (state) {
      case 'not-started':
        dot = null;
        color = 'grey';
        break;
      case 'pending':
        color = 'orange';
        dot = <LoadingOutlined spin={false} color={color} />;
        break;
      case 'done':
        color = 'green';
        dot = <CheckCircleOutlined color={color} />;
        break;
      case 'failed':
        color = '#B14334'; // var(--red)
        dot = <CloseCircleOutlined color={color} />;
        break;
    }

    return (
      <Timeline.Item
        key={title}
        dot={dot}
        color={color}
        className={state === 'pending' ? 'floating' : ''}
      >
        <span className={state === 'pending' ? css.floating : ''}>{title}</span>
      </Timeline.Item>
    );

    // // TODO:
    // // const renderStreamDelay =
    // //   modificators?.renderStreamDelay &&
    // //   this.view.info.checklist.startVideoTransmission === 'pending';
    // return (
    //   <li
    //     key={title}
    //     className={cx({
    //       [css.notStarted]: state === 'not-started',
    //       [css.itemError]: state === 'failed',
    //     })}
    //   >
    //     <CheckMark state={state} />
    //     <span>{title}</span>
    //     {/*{renderStreamDelay && <span className={css.pending}> {this.delaySecondsRemaining}s</span>}*/}
    //   </li>
    // );
  }

  function renderYtWarning() {
    return (
      <MessageLayout>
        <p>
          {$t(
            'Auto-start is disabled for your broadcast. You should manually publish your stream from Youtube Studio',
          )}
        </p>
        <button
          className="button button--default"
          onClick={() => Services.YoutubeService.actions.openDashboard()}
        >
          {$t('Open Youtube Studio')}
        </button>
      </MessageLayout>
    );
  }

  return render();
}

/**
 * Renders a check mark in one of 4 states - 'not-started', 'pending', 'done', 'error'
 */
function CheckMark(p: { state: TGoLiveChecklistItemState }) {
  const state = p.state || 'not-started';
  const cssClass = cx(css.check, css[state]);
  return (
    <span className={cssClass}>
      {state === 'not-started' && <i className="fa fa-circle" />}
      {state === 'pending' && <i className="fa fa-spinner fa-pulse" />}
      {state === 'done' && <i key="done" className="fa fa-check" />}
      {state === 'failed' && <i className="fa fa-times" />}
    </span>
  );
}
