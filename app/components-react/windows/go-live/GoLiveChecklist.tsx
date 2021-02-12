import { IGoLiveProps } from './go-live';
import css from './GoLiveChecklist.m.less';
import React, { HTMLAttributes } from 'react';
import { useOnCreate, useVuex } from '../../hooks';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
import { TGoLiveChecklistItemState } from '../../../services/streaming';
import cx from 'classnames';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import GoLiveError from './GoLiveError';
import MessageLayout from './MessageLayout';

/**
 * Shows transition to live progress and helps troubleshoot related problems
 */
export default function GoLiveChecklist(p: { isUpdateMode?: boolean } & HTMLAttributes<unknown>) {
  // define a reactive state
  const v = useVuex(() => {
    const { StreamingService, VideoEncodingOptimizationService, TwitterService } = Services;
    const view = StreamingService.views;
    return {
      isError: !!view.info.error,
      lifecycle: view.info.lifecycle,
      checklist: view.info.checklist,
      isMultiplatformMode: view.isMultiplatformMode,
      shouldShowOptimizedProfile:
        VideoEncodingOptimizationService.state.useOptimizedProfile && !p.isUpdateMode,
      shouldPostTweet: TwitterService.state.linked && TwitterService.state.tweetWhenGoingLive,
      enabledPlatforms: view.enabledPlatforms,
      delayEnabled: StreamingService.delayEnabled,
      warning: view.info.warning,
    };
  });

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

  function getPlatformDisplayName(platform: TPlatform): string {
    return getPlatformService(platform).displayName;
  }

  function render() {
    return (
      <div className={cx(css.container, p.className)}>
        <h1>{getHeaderText()}</h1>

        <ul className={css.checklist}>
          {/* PLATFORMS UPDATE */}
          {v.enabledPlatforms.map(platform =>
            renderCheck(
              $t('Update settings for %{platform}', {
                platform: getPlatformDisplayName(platform),
              }),
              v.checklist[platform],
            ),
          )}

          {/* RESTREAM */}
          {!p.isUpdateMode &&
            v.isMultiplatformMode &&
            renderCheck($t('Configure the Multistream service'), v.checklist.setupMultistream)}

          {/* OPTIMIZED PROFILE */}
          {v.shouldShowOptimizedProfile &&
            renderCheck($t('Apply optimized settings'), v.checklist.applyOptimizedSettings)}

          {/* START TRANSMISSION */}
          {!p.isUpdateMode &&
            renderCheck($t('Start video transmission'), v.checklist.startVideoTransmission, {
              renderStreamDelay: v.delayEnabled,
            })}

          {/* POST A TWEET */}
          {v.shouldPostTweet && renderCheck($t('Post a tweet'), v.checklist.postTweet)}
        </ul>

        {/* WARNING MESSAGE */}
        {v.warning && renderYtWarning()}

        {/* ERROR MESSAGE */}
        <GoLiveError />
      </div>
    );
  }

  function getHeaderText() {
    if (v.isError) {
      if (v.checklist.startVideoTransmission === 'done') {
        return $t('Your stream has started, but there were issues with other actions taken');
      } else {
        return $t('Something went wrong');
      }
    }
    if (v.lifecycle === 'live') {
      return $t("You're live!");
    }
    return $t('Working on your live stream');
  }

  function renderCheck(
    title: string,
    state: TGoLiveChecklistItemState,
    modificators?: { renderStreamDelay?: boolean },
  ) {
    // TODO:
    // const renderStreamDelay =
    //   modificators?.renderStreamDelay &&
    //   this.view.info.checklist.startVideoTransmission === 'pending';
    return (
      <li
        key={title}
        className={cx({
          [css.notStarted]: state === 'not-started',
          [css.itemError]: state === 'failed',
        })}
      >
        <CheckMark state={state} />
        <span>{title}</span>
        {/*{renderStreamDelay && <span className={css.pending}> {this.delaySecondsRemaining}s</span>}*/}
      </li>
    );
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
          onClick={() => Services.YoutubeService.openDashboard()}
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
