import TsxComponent from '../../tsx-component';
import { Inject } from '../../../services/core';
import { StreamingService, TGoLiveChecklistItemState } from '../../../services/streaming';
import { WindowsService } from '../../../services/windows';
import { StreamInfoDeprecatedService } from '../../../services/stream-info-deprecated';
import { $t } from 'services/i18n';
import { Component } from 'vue-property-decorator';
import styles from './GoLiveChecklist.m.less';
import cx from 'classnames';
import { YoutubeService } from '../../../services/platforms/youtube';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import electron from 'electron';
import HFormGroup from '../../shared/inputs/HFormGroup.vue';
import TextInput from '../../shared/inputs/TextInput';
import Utils from '../../../services/utils';

/**
 * Shows transition to live and helps troubleshoot related problems
 */
@Component({})
export default class GoLiveChecklist extends TsxComponent<{}> {
  @Inject() private streamingService: StreamingService;
  @Inject() private windowsService: WindowsService;
  @Inject() private youtubeService: YoutubeService;
  @Inject('StreamInfoDeprecatedService') private streamInfoService: StreamInfoDeprecatedService;

  private isErrorDetailsShown = false;
  private shouldShowLinks = false;
  private confirmationCopyMessage = '';

  private get state() {
    return this.streamingService.views;
  }

  private get error() {
    return this.state.info.error;
  }

  private get shouldShowChecklist() {
    return !this.shouldShowLinks;
  }

  private get settings() {
    return this.state.goLiveSettings;
  }

  private get lifecycle() {
    return this.state.info.lifecycle;
  }

  private getPlatformDisplayName(platform: TPlatform): string {
    return getPlatformService(platform).displayName;
  }

  private openLink(url: string) {
    electron.remote.shell.openExternal(url);
  }

  private getHeaderText() {
    if (this.error) {
      return $t('Something went wrong');
    }
    if (this.lifecycle === 'live') {
      return $t("You're live!");
    }
    return $t('Working on your livestream');
  }

  private copyToClipboard(url: string, confirmMessage: string) {
    Utils.copyToClipboard(url);
    this.confirmationCopyMessage = confirmMessage;
  }

  private render() {
    const checklist = this.state.info.checklist;

    return (
      <div class={styles.container}>
        <h1>{this.getHeaderText()}</h1>

        {this.shouldShowChecklist && (
          <ul class={styles.checklist}>
            {this.settings.useOptimizedProfile &&
              this.renderCheck($t('Apply optimized settings'), checklist.applyOptimizedSettings)}
            {this.state.enabledPlatforms.map(platform =>
              this.renderCheck(
                $t('Update settings for %{platform}', {
                  platform: this.getPlatformDisplayName(platform),
                }),
                checklist[platform],
              ),
            )}
            {this.state.shouldGoLiveWithRestream &&
              this.renderCheck($t('Configure the Restream service'), checklist.setupRestream)}
            {this.renderCheck($t('Start video transmission'), checklist.startVideoTransmission)}
            {this.settings.destinations.youtube?.enabled &&
              this.renderCheck(
                $t('Publish Youtube broadcast') + ' ' + this.renderYoutubePercentage(),
                checklist.publishYoutubeBroadcast,
              )}
            {this.renderCheck($t('Tweet after go live'), checklist.tweetWhenGoLive)}
          </ul>
        )}

        {this.error && (
          <div class={cx('section section--warning', styles.error)}>
            {this.error.message}
            {this.error.details && !this.isErrorDetailsShown && (
              <p>
                <a onClick={() => (this.isErrorDetailsShown = true)}>{$t('Show details')}</a>
              </p>
            )}
            {this.error.details && this.isErrorDetailsShown && (
              <p class={styles.error}>{this.error.details}</p>
            )}
          </div>
        )}

        {this.renderLinks()}
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
    if (this.state.info.checklist.publishYoutubeBroadcast === 'not-started') return '';
    const progressInfo = this.youtubeService.progressInfo;
    return ` ${progressInfo.progress * 100}%`;
  }

  private renderLinks() {
    const visibility = this.lifecycle === 'live' ? 'visible' : 'hidden';
    return (
      <div style={{ visibility }}>
        {/* LINKS BUTTON */}
        {!this.shouldShowLinks && (
          <p style={{ textAlign: 'center' }}>
            <a onclick={() => (this.shouldShowLinks = true)}>{$t('Show stream links')}</a>
          </p>
        )}

        {/* LINKS LIST */}
        {this.shouldShowLinks && (
          <div class={styles.linksContainer}>
            {this.state.enabledPlatforms.map(platform => {
              const service = getPlatformService(platform);
              const name = service.displayName;
              const url = service.state.streamPageUrl;
              return (
                <div class={styles.streamLink}>
                  <HFormGroup title={name}>
                    <TextInput value={url} metadata={{ disabled: true }} />
                    <button
                      onclick={() =>
                        this.copyToClipboard(
                          url,
                          $t('Link to the %{platform} page has been copied to your clipboard', {
                            platform: name,
                          }),
                        )
                      }
                      class="button button--action"
                    >
                      {$t('Copy')}
                    </button>
                    <button onclick={() => this.openLink(url)} class="button button--default">
                      {$t('Open')}
                    </button>
                  </HFormGroup>
                </div>
              );
            })}
          </div>
        )}

        {/* CONFIRMATION MESSAGE FOR CLIPBOARD */}
        {this.confirmationCopyMessage && (
          <p style={{ textAlign: 'center' }}>{this.confirmationCopyMessage}</p>
        )}
      </div>
    );
  }
}
