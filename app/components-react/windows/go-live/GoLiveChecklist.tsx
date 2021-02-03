import { IGoLiveProps } from './go-live';
import css from './GoLiveChecklist.m.less';
import React, { HTMLAttributes } from 'react';
import { useOnCreate, useVuex } from '../../hooks';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
import { TGoLiveChecklistItemState } from '../../../services/streaming';
import cx from 'classnames';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import Transition from '../../shared/Transition';

/**
 * Shows transition to live progress and helps troubleshoot related problems
 */
export default function GoLiveChecklist(p: { isUpdateMode?: boolean } & HTMLAttributes<unknown>) {
  const { isUpdateMode } = p;

  // define reactive state
  const rs = useVuex(() => {
    const { StreamingService, VideoEncodingOptimizationService, TwitterService } = Services;
    const view = StreamingService.views;
    return {
      isError: !!view.info.error,
      lifecycle: view.info.lifecycle,
      checklist: view.info.checklist,
      isMultiplatformMode: view.isMultiplatformMode,
      shouldShowOptimizedProfile:
        VideoEncodingOptimizationService.state.useOptimizedProfile && !isUpdateMode,
      shouldPostTweet: TwitterService.state.linked && TwitterService.state.tweetWhenGoingLive,
      enabledPlatforms: view.enabledPlatforms,
      delayEnabled: StreamingService.delayEnabled,
      warning: view.info.warning,
    };
  });

  useOnCreate(() => {
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
      <div className={css.container}>
        <h1>{getHeaderText()}</h1>

        <ul className={css.checklist}>
          {/* PLATFORMS UPDATE */}
          {rs.enabledPlatforms.map(platform =>
            renderCheck(
              $t('Update settings for %{platform}', {
                platform: getPlatformDisplayName(platform),
              }),
              rs.checklist[platform],
            ),
          )}

          {/* RESTREAM */}
          {!isUpdateMode &&
            rs.isMultiplatformMode &&
            renderCheck($t('Configure the Multistream service'), rs.checklist.setupMultistream)}

          {/* OPTIMIZED PROFILE */}
          {rs.shouldShowOptimizedProfile &&
            renderCheck($t('Apply optimized settings'), rs.checklist.applyOptimizedSettings)}

          {/* START TRANSMISSION */}
          {!isUpdateMode &&
            renderCheck($t('Start video transmission'), rs.checklist.startVideoTransmission, {
              renderStreamDelay: rs.delayEnabled,
            })}

          {/* POST A TWEET */}
          {rs.shouldPostTweet && renderCheck($t('Post a tweet'), rs.checklist.postTweet)}
        </ul>

        {/* WARNING MESSAGE */}
        {renderWarning()}

        {/* ERROR MESSAGE */}
        {/*<GoLiveError />*/}
      </div>
    );
  }

  function getHeaderText() {
    if (rs.isError) {
      if (rs.checklist.startVideoTransmission === 'done') {
        return $t('Your stream has started, but there were issues with other actions taken');
      } else {
        return $t('Something went wrong');
      }
    }
    if (rs.lifecycle === 'live') {
      return $t("You're live!");
    }
    return $t('Working on your live stream');
  }

  function renderCheck(
    title: string,
    state: TGoLiveChecklistItemState,
    modificators?: { renderStreamDelay?: boolean },
  ) {
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

  function renderWarning() {
    if (!rs.warning) return;
    return (
      <div className="section selectable">
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
      </div>
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
      <Transition name="checkboxdone">
        {state === 'done' && <i key="done" className="fa fa-check" />}
      </Transition>
      {state === 'failed' && <i className="fa fa-times" />}
    </span>
  );
}

//
// import TsxComponent, { createProps } from 'components/tsx-component';
// import { Inject } from 'services/core';
// import { StreamingService, TGoLiveChecklistItemState } from '../../../services/streaming';
// import { WindowsService } from 'services/windows';
// import { $t } from 'services/i18n';
// import { Component, Watch } from 'vue-property-decorator';
// import styles from './GoLiveChecklist.m.less';
// import cx from 'classnames';
// import { YoutubeService } from 'services/platforms/youtube';
// import { getPlatformService, TPlatform } from 'services/platforms';
// import { TwitterService } from 'services/integrations/twitter';
// import GoLiveError from './GoLiveError';
// import { VideoEncodingOptimizationService } from 'services/video-encoding-optimizations';
// import Utils from 'services/utils';
//
// class Props {
//   /**
//    * True if we're updating a stream instead of creating a new one
//    */
//   isUpdateMode? = false;
// }
//
// /**
//  * Shows transition to live progress and helps troubleshoot related problems
//  */
// @Component({ props: createProps(Props) })
// export default class GoLiveChecklist extends TsxComponent<Props> {
//   @Inject() private streamingService: StreamingService;
//   @Inject() private windowsService: WindowsService;
//   @Inject() private youtubeService: YoutubeService;
//   @Inject() private twitterService: TwitterService;
//   @Inject() private videoEncodingOptimizationService: VideoEncodingOptimizationService;
//   private delayEnabled = this.streamingService.delayEnabled;
//   private delaySecondsRemaining = 0;
//
//   created() {
//     if (!this.delayEnabled) return;
//     const updateDelaySecondsRemaining = () => {
//       this.delaySecondsRemaining = this.streamingService.delaySecondsRemaining;
//       setTimeout(() => {
//         updateDelaySecondsRemaining();
//       }, 1000);
//     };
//     updateDelaySecondsRemaining();
//   }
//
//   private get view() {
//     return this.streamingService.views;
//   }
//
//   private get lifecycle() {
//     return this.streamingService.state.info.lifecycle;
//   }
//
//   private get error() {
//     return this.view.info.error;
//   }
//
//   private getPlatformDisplayName(platform: TPlatform): string {
//     return getPlatformService(platform).displayName;
//   }
//
//   @Watch('lifecycle')
//   private async watchLifecycle() {
//     // close this window in 1s after start streaming
//     if (this.lifecycle === 'live' && !this.view.info.warning) {
//       await Utils.sleep(1000);
//       if (this.windowsService.state.child.componentName === 'GoLiveWindow') {
//         this.windowsService.closeChildWindow();
//       }
//     }
//   }
//
//   private getHeaderText() {
//     if (this.error) {
//       if (this.view.info.checklist.startVideoTransmission === 'done') {
//         return $t('Your stream has started, but there were issues with other actions taken');
//       } else {
//         return $t('Something went wrong');
//       }
//     }
//     if (this.view.info.lifecycle === 'live') {
//       return $t("You're live!");
//     }
//     return $t('Working on your live stream');
//   }
//
//   private render() {
//     const checklist = this.view.info.checklist;
//     const { isMultiplatformMode } = this.view;
//     const isUpdateMode = this.props.isUpdateMode;
//     const shouldShowOptimizedProfile =
//       this.videoEncodingOptimizationService.state.useOptimizedProfile && !isUpdateMode;
//     const shouldPostTweet =
//       this.twitterService.state.linked && this.twitterService.state.tweetWhenGoingLive;
//
//     return (
//       <div class={styles.container}>
//         <h1>{this.getHeaderText()}</h1>
//
//         <ul class={styles.checklist}>
//           {/* PLATFORMS UPDATE */}
//           {this.view.enabledPlatforms.map(platform =>
//             this.renderCheck(
//               $t('Update settings for %{platform}', {
//                 platform: this.getPlatformDisplayName(platform),
//               }),
//               checklist[platform],
//             ),
//           )}
//
//           {/* RESTREAM */}
//           {!isUpdateMode &&
//             isMultiplatformMode &&
//             this.renderCheck($t('Configure the Multistream service'), checklist.setupMultistream)}
//
//           {/* OPTIMIZED PROFILE */}
//           {shouldShowOptimizedProfile &&
//             this.renderCheck($t('Apply optimized settings'), checklist.applyOptimizedSettings)}
//
//           {/* START TRANSMISSION */}
//           {!isUpdateMode &&
//             this.renderCheck($t('Start video transmission'), checklist.startVideoTransmission, {
//               renderStreamDelay: this.delayEnabled,
//             })}
//
//           {/* POST A TWEET */}
//           {shouldPostTweet && this.renderCheck($t('Post a tweet'), checklist.postTweet)}
//         </ul>
//
//         {/* WARNING MESSAGE */}
//         {this.renderWarning()}
//
//         {/* ERROR MESSAGE */}
//         <GoLiveError />
//       </div>
//     );
//   }
//
//   private renderCheck(
//     title: string,
//     state: TGoLiveChecklistItemState,
//     modificators?: { renderStreamDelay?: boolean },
//   ) {
//     const renderStreamDelay =
//       modificators?.renderStreamDelay &&
//       this.view.info.checklist.startVideoTransmission === 'pending';
//     return (
//       <li
//         key={title}
//         class={{
//           [styles.notStarted]: state === 'not-started',
//           [styles.itemError]: state === 'failed',
//         }}
//       >
//         <CheckMark state={state} />
//         <span>{title}</span>
//         {renderStreamDelay && <span class={styles.pending}> {this.delaySecondsRemaining}s</span>}
//       </li>
//     );
//   }
//
//   private renderWarning() {
//     if (!this.view.info.warning) return;
//     return (
//       <div class="section selectable">
//         <p>
//           {$t(
//             'Auto-start is disabled for your broadcast. You should manually publish your stream from Youtube Studio',
//           )}
//         </p>
//         <button class="button button--default" onclick={() => this.youtubeService.openDashboard()}>
//           {$t('Open Youtube Studio')}
//         </button>
//       </div>
//     );
//   }
// }
//
// class CheckMarkProps {
//   state: TGoLiveChecklistItemState = 'not-started';
// }
//
// /**
//  * Renders a check mark in one of 4 states - 'not-started', 'pending', 'done', 'error'
//  */
// @Component({ props: createProps(CheckMarkProps) })
// class CheckMark extends TsxComponent<CheckMarkProps> {
//   render() {
//     const state = this.props.state;
//     const cssClass = cx(styles.check, styles[state]);
//     return (
//       <span class={cssClass}>
//         {state === 'not-started' && <i class="fa fa-circle" />}
//         {state === 'pending' && <i class="fa fa-spinner fa-pulse" />}
//         <transition name="checkboxdone">
//           {state === 'done' && <i key="done" class="fa fa-check" />}
//         </transition>
//         {state === 'failed' && <i class="fa fa-times" />}
//       </span>
//     );
//   }
// }
