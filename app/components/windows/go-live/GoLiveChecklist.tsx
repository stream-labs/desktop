import TsxComponent, { createProps } from 'components/tsx-component';
import { Inject } from 'services/core';
import { StreamingService, TGoLiveChecklistItemState } from '../../../services/streaming';
import { WindowsService } from 'services/windows';
import { $t } from 'services/i18n';
import { Component, Watch } from 'vue-property-decorator';
import styles from './GoLiveChecklist.m.less';
import cx from 'classnames';
import { YoutubeService } from 'services/platforms/youtube';
import { getPlatformService, TPlatform } from 'services/platforms';
import { TwitterService } from 'services/integrations/twitter';
import GoLiveError from './GoLiveError';
import { VideoEncodingOptimizationService } from 'services/video-encoding-optimizations';
import Utils from 'services/utils';

class Props {
  /**
   * True if we're updating a stream instead of creating a new one
   */
  isUpdateMode? = false;
}

/**
 * Shows transition to live progress and helps troubleshoot related problems
 */
@Component({ props: createProps(Props) })
export default class GoLiveChecklist extends TsxComponent<Props> {
  @Inject() private streamingService: StreamingService;
  @Inject() private windowsService: WindowsService;
  @Inject() private youtubeService: YoutubeService;
  @Inject() private twitterService: TwitterService;
  @Inject() private videoEncodingOptimizationService: VideoEncodingOptimizationService;
  private delayEnabled = this.streamingService.delayEnabled;
  private delaySecondsRemaining = 0;

  created() {
    if (!this.delayEnabled) return;
    const updateDelaySecondsRemaining = () => {
      this.delaySecondsRemaining = this.streamingService.delaySecondsRemaining;
      setTimeout(() => {
        updateDelaySecondsRemaining();
      }, 1000);
    };
    updateDelaySecondsRemaining();
  }

  private get view() {
    return this.streamingService.views;
  }

  private get lifecycle() {
    return this.streamingService.state.info.lifecycle;
  }

  private get error() {
    return this.view.info.error;
  }

  private getPlatformDisplayName(platform: TPlatform): string {
    return getPlatformService(platform).displayName;
  }

  @Watch('lifecycle')
  private async watchLifecycle() {
    // close window in 1s after start streaming
    if (this.lifecycle === 'live') {
      await Utils.sleep(1000);
      this.windowsService.closeChildWindow();
    }
  }

  private getHeaderText() {
    if (this.error) {
      if (this.view.info.checklist.startVideoTransmission === 'done') {
        return $t('Your stream has started, but there were issues with other actions taken');
      } else {
        return $t('Something went wrong');
      }
    }
    if (this.view.info.lifecycle === 'live') {
      return $t("You're live!");
    }
    return $t('Working on your live stream');
  }

  private render() {
    const checklist = this.view.info.checklist;
    const { isMultiplatformMode, goLiveSettings } = this.view;
    const isUpdateMode = this.props.isUpdateMode;
    const shouldPublishYT = !isUpdateMode && goLiveSettings.platforms.youtube?.enabled;
    const shouldShowOptimizedProfile =
      this.videoEncodingOptimizationService.state.useOptimizedProfile && !isUpdateMode;
    const shouldPostTweet =
      this.twitterService.state.linked && this.twitterService.state.tweetWhenGoingLive;

    return (
      <div class={styles.container}>
        <h1>{this.getHeaderText()}</h1>

        <ul class={styles.checklist}>
          {/* PLATFORMS UPDATE */}
          {this.view.enabledPlatforms.map(platform =>
            this.renderCheck(
              $t('Update settings for %{platform}', {
                platform: this.getPlatformDisplayName(platform),
              }),
              checklist[platform],
            ),
          )}

          {/* RESTREAM */}
          {!isUpdateMode &&
            isMultiplatformMode &&
            this.renderCheck($t('Configure the Multistream service'), checklist.setupRestream)}

          {/* OPTIMIZED PROFILE */}
          {shouldShowOptimizedProfile &&
            this.renderCheck($t('Apply optimized settings'), checklist.applyOptimizedSettings)}

          {/* START TRANSMISSION */}
          {!isUpdateMode &&
            this.renderCheck($t('Start video transmission'), checklist.startVideoTransmission, {
              renderStreamDelay: this.delayEnabled,
            })}

          {/* PUBLISH YT BROADCAST */}
          {shouldPublishYT &&
            this.renderCheck($t('Publish Youtube broadcast'), checklist.publishYoutubeBroadcast, {
              renderYTPercentage: true,
            })}

          {/* POST A TWEET */}
          {shouldPostTweet && this.renderCheck($t('Post a tweet'), checklist.postTweet)}
        </ul>

        {/* ERROR MESSAGE */}
        <GoLiveError />
      </div>
    );
  }

  private renderCheck(
    title: string,
    state: TGoLiveChecklistItemState,
    modificators?: { renderYTPercentage?: boolean; renderStreamDelay?: boolean },
  ) {
    const renderYTPercentage = modificators?.renderYTPercentage;
    const renderStreamDelay =
      modificators?.renderStreamDelay &&
      this.view.info.checklist.startVideoTransmission === 'pending';
    return (
      <li
        key={title}
        class={{
          [styles.notStarted]: state === 'not-started',
          [styles.itemError]: state === 'failed',
        }}
      >
        <CheckMark state={state} />
        <span>{title}</span>
        {renderYTPercentage && this.renderYoutubePercentage()}
        {renderStreamDelay && <span class={styles.pending}> {this.delaySecondsRemaining}s</span>}
      </li>
    );
  }

  private renderYoutubePercentage() {
    if (this.view.info.checklist.publishYoutubeBroadcast === 'not-started') return '';
    const progressInfo = this.youtubeService.progressInfo;
    return <span class={styles.pending}> {progressInfo.progress * 100}%</span>;
  }
}

class CheckMarkProps {
  state: TGoLiveChecklistItemState = 'not-started';
}

/**
 * Renders a check mark in one of 4 states - 'not-started', 'pending', 'done', 'error'
 */
@Component({ props: createProps(CheckMarkProps) })
class CheckMark extends TsxComponent<CheckMarkProps> {
  render() {
    const state = this.props.state;
    const cssClass = cx(styles.check, styles[state]);
    return (
      <span class={cssClass}>
        {state === 'not-started' && <i class="fa fa-circle" />}
        {state === 'pending' && <i class="fa fa-spinner fa-pulse" />}
        <transition name="checkboxdone">
          {state === 'done' && <i key="done" class="fa fa-check" />}
        </transition>
        {state === 'failed' && <i class="fa fa-times" />}
      </span>
    );
  }
}
