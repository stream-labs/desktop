import TsxComponent from '../../tsx-component';
import { Inject } from '../../../services/core';
import { StreamingService, TGoLiveChecklistItemState } from '../../../services/streaming';
import { WindowsService } from '../../../services/windows';
import { $t } from 'services/i18n';
import { Component } from 'vue-property-decorator';
import styles from './GoLiveChecklist.m.less';
import cx from 'classnames';
import { YoutubeService } from '../../../services/platforms/youtube';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import { TwitterService } from '../../../services/integrations/twitter';
import GoLiveError from './GoLiveError';

/**
 * Shows transition to live and helps troubleshoot related problems
 */
@Component({})
export default class GoLiveChecklist extends TsxComponent<{}> {
  @Inject() private streamingService: StreamingService;
  @Inject() private windowsService: WindowsService;
  @Inject() private youtubeService: YoutubeService;
  @Inject() private twitterService: TwitterService;

  private isErrorDetailsShown = false;

  private get view() {
    return this.streamingService.views;
  }

  private get error() {
    return this.view.info.error;
  }

  private getPlatformDisplayName(platform: TPlatform): string {
    return getPlatformService(platform).displayName;
  }

  private getHeaderText() {
    if (this.error) {
      return $t('Something went wrong');
    }
    if (this.view.info.lifecycle === 'live') {
      return $t("You're live!");
    }
    return $t('Working on your livestream');
  }

  private render() {
    const checklist = this.view.info.checklist;
    const { isMidStreamMode, isMutliplatformMode, goLiveSettings } = this.view;
    const shouldPublishYT = !isMidStreamMode && goLiveSettings.destinations.youtube?.enabled;

    return (
      <div class={styles.container}>
        <h1>{this.getHeaderText()}</h1>

        <ul class={styles.checklist}>
          {/* OPTIMIZED PROFILE */}
          {!isMidStreamMode &&
            goLiveSettings.useOptimizedProfile &&
            this.renderCheck($t('Apply optimized settings'), checklist.applyOptimizedSettings)}

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
          {!isMidStreamMode &&
            isMutliplatformMode &&
            this.renderCheck($t('Configure the Restream service'), checklist.setupRestream)}

          {/* START TRANSMISSION */}
          {!isMidStreamMode &&
            this.renderCheck($t('Start video transmission'), checklist.startVideoTransmission)}

          {/* PUBLISH  YT BROADCAST */}
          {shouldPublishYT &&
            this.renderCheck(
              $t('Publish Youtube broadcast') + ' ' + this.renderYoutubePercentage(),
              checklist.publishYoutubeBroadcast,
            )}
        </ul>

        {/* ERROR MESSAGE */}
        <GoLiveError />
      </div>
    );
  }

  private renderCheck(title: string, state: TGoLiveChecklistItemState) {
    return (
      <li
        class={{
          [styles.notStarted]: state === 'not-started',
          [styles.itemError]: state === 'failed',
        }}
      >
        {this.renderCheckMark(state)}
        {title}
      </li>
    );
  }

  private renderCheckMark(state: TGoLiveChecklistItemState) {
    switch (state) {
      case 'not-started':
        return (
          <span class={cx(styles.check, styles.notStarted)}>
            <i class="fa fa-circle" />
          </span>
        );
      case 'pending':
        return (
          <span class={cx(styles.check, styles.pending)}>
            <i class="fa fa-spinner fa-pulse" />
          </span>
        );
      case 'done':
        return (
          <span class={cx(styles.check, styles.done)}>
            <i class="fa fa-check" />
          </span>
        );
      case 'failed':
        return (
          <span class={cx(styles.check, styles.failed)}>
            <i class="fa fa-times" />
          </span>
        );
    }
  }

  private renderYoutubePercentage() {
    if (this.view.info.checklist.publishYoutubeBroadcast === 'not-started') return '';
    const progressInfo = this.youtubeService.progressInfo;
    return ` ${progressInfo.progress * 100}%`;
  }
}
