import TsxComponent from 'components/tsx-component';
import { Inject } from 'services/core';
import { StreamingService } from 'services/streaming';
import { WindowsService } from 'services/windows';
import { $t } from 'services/i18n';
import { Component } from 'vue-property-decorator';
import styles from './GoLiveError.m.less';
import { YoutubeService } from 'services/platforms/youtube';
import { getPlatformService, TPlatform } from 'services/platforms';
import { TwitterService } from 'services/integrations/twitter';
import { IStreamError } from 'services/streaming/stream-error';
import Translate from 'components/shared/translate';
import { UserService } from 'services/user';
import { NavigationService } from 'services/navigation';
import { assertIsDefined } from 'util/properties-type-guards';
import MessageLayout from './MessageLayout';

/**
 * Shows error and troubleshooting suggestions
 */
@Component({})
export default class GoLiveError extends TsxComponent<{}> {
  @Inject() private streamingService: StreamingService;
  @Inject() private windowsService: WindowsService;
  @Inject() private youtubeService: YoutubeService;
  @Inject() private twitterService: TwitterService;
  @Inject() private userService: UserService;
  @Inject() private navigationService: NavigationService;

  private get view() {
    return this.streamingService.views;
  }

  private goToYoutubeDashboard() {
    this.youtubeService.openDashboard();
  }

  private skipPrepopulateAndGoLive() {
    this.streamingService.actions.goLive();
  }

  private skipSettingsUpdateAndGoLive() {
    this.streamingService.actions.finishStartStreaming();
    this.windowsService.actions.closeChildWindow();
  }

  private navigatePlatformMerge(platform: TPlatform) {
    this.navigationService.navigate('PlatformMerge', { platform });
    this.windowsService.actions.closeChildWindow();
  }

  private enableYT() {
    this.youtubeService.actions.openYoutubeEnable();
  }

  private enablePrime() {
    this.userService.actions.openPrimeUrl('slobs-multistream');
  }

  private tryAgain() {
    if (this.windowsService.state.child.componentName === 'EditStreamWindow') {
      this.streamingService.actions.updateStreamSettings(this.view.info.settings);
    } else {
      this.streamingService.actions.goLive(this.view.info.settings);
    }
  }

  private render() {
    const error = this.view.info.error;
    if (!error) return;
    const type = error.type || 'UNKNOWN_ERROR';
    switch (type) {
      case 'PREPOPULATE_FAILED':
        return this.renderPrepopulateError(error);
      case 'PRIME_REQUIRED':
        return this.renderPrimeRequiredError(error);
      case 'TWITCH_MISSED_OAUTH_SCOPE':
        return this.renderTwitchMissedScopeError(error);
      case 'SETTINGS_UPDATE_FAILED':
        return this.renderSettingsUpdateError(error);
      case 'RESTREAM_DISABLED':
      case 'RESTREAM_SETUP_FAILED':
        return this.renderRestreamError(error);
      case 'YOUTUBE_STREAMING_DISABLED':
        return this.renderYoutubeStreamingDisabled(error);
      case 'MACHINE_LOCKED':
        return this.renderMachineLockedError(error);
      default:
        return <MessageLayout error={error} />;
    }
  }

  private renderPrepopulateError(error: IStreamError) {
    assertIsDefined(error.platform);
    const platformName = getPlatformService(error.platform).displayName;
    return (
      <MessageLayout
        error={error}
        message={$t('Failed to fetch settings from %{platformName}', { platformName })}
      >
        <Translate
          message={$t('prepopulateStreamSettingsError')}
          scopedSlots={{
            fetchAgainLink: (text: string) => (
              <a
                class={styles.link}
                onClick={() => this.streamingService.actions.prepopulateInfo()}
              >
                {{ text }}
              </a>
            ),
            justGoLiveLink: (text: string) => (
              <a class={styles.link} onclick={() => this.skipPrepopulateAndGoLive()}>
                {{ text }}
              </a>
            ),
          }}
        />
      </MessageLayout>
    );
  }

  private renderPrimeRequiredError(error: IStreamError) {
    return (
      <MessageLayout message={$t('Multistreaming to these platforms requires Prime')}>
        <button class="button button--prime" onClick={() => this.enablePrime()}>
          {$t('Become a Prime member')}
        </button>
      </MessageLayout>
    );
  }

  private renderTwitchMissedScopeError(error: IStreamError) {
    // If primary platform, then ask to re-login
    if (this.userService.state.auth?.primaryPlatform === 'twitch') {
      return this.renderPrepopulateError(error);
    }

    // If not primary platform than ask to connect platform again from SLOBS
    assertIsDefined(error.platform);
    const platformName = getPlatformService(error.platform).displayName;
    return (
      <MessageLayout
        message={$t('Failed to fetch settings from %{platformName}', { platformName })}
      >
        <Translate
          message={$t('twitchMissedScopeError')}
          scopedSlots={{
            connectButton: (text: string) => (
              <button
                class="button button--twitch"
                onClick={() => this.navigatePlatformMerge('twitch')}
              >
                {{ text }}
              </button>
            ),
          }}
        />
      </MessageLayout>
    );
  }

  private renderSettingsUpdateError(error: IStreamError) {
    assertIsDefined(error.platform);
    const platformName = getPlatformService(error.platform).displayName;
    return (
      <MessageLayout
        error={error}
        message={$t('Failed to update settings for %{platformName}', { platformName })}
      >
        <Translate
          message={$t('updateStreamSettingsError')}
          scopedSlots={{
            tryAgainLink: (text: string) => (
              <a class={styles.link} onClick={() => this.tryAgain()}>
                {{ text }}
              </a>
            ),
            justGoLiveLink: (text: string) => (
              <a class={styles.link} onclick={() => this.skipSettingsUpdateAndGoLive()}>
                {{ text }}
              </a>
            ),
          }}
        />
      </MessageLayout>
    );
  }

  private renderYoutubeStreamingDisabled(error: IStreamError) {
    return (
      <MessageLayout message={error.message}>
        {$t(
          'Please enable your account for live streaming, and wait 24 hours before attempting to stream.',
        )}
        <br />
        <button
          class="button button--warn"
          style={{ marginTop: '8px' }}
          onClick={() => this.enableYT()}
        >
          {$t('Enable Live Streaming')}
        </button>
      </MessageLayout>
    );
  }

  private renderRestreamError(error: IStreamError) {
    return (
      <MessageLayout error={error}>
        {$t(
          'Please try again. If the issue persists, you can stream directly to a single platform instead.',
        )}
      </MessageLayout>
    );
  }

  private renderYoutubePublishError(error: IStreamError) {
    return (
      <MessageLayout error={error}>
        <Translate
          message={$t('youtubeStatusError')}
          scopedSlots={{
            dashboardLink: (text: string) => (
              <a class={styles.link} onClick={() => this.goToYoutubeDashboard()}>
                {{ text }}
              </a>
            ),
          }}
        />
      </MessageLayout>
    );
  }

  private renderMachineLockedError(error: IStreamError) {
    return (
      <MessageLayout error={error}>
        {$t('You could try locking and unlocking your computer to fix this error.')}
      </MessageLayout>
    );
  }
}
