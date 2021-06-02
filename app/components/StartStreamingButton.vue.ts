import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { StreamingService, EStreamingState } from 'services/streaming';
import { Inject } from 'services/core/injector';
import { UserService } from 'services/user';
import { CustomizationService } from 'services/customization';
import { MediaBackupService, EGlobalSyncStatus } from 'services/media-backup';
import { VideoEncodingOptimizationService } from 'services/video-encoding-optimizations';
import electron from 'electron';
import { $t } from 'services/i18n';
import { SourcesService } from 'services/sources';
import { StreamSettingsService } from 'services/settings/streaming';
import { RestreamService } from 'services/restream';
import { FacebookService } from 'services/platforms/facebook';

@Component({})
export default class StartStreamingButton extends Vue {
  @Inject() streamingService: StreamingService;
  @Inject() streamSettingsService: StreamSettingsService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() mediaBackupService: MediaBackupService;
  @Inject() videoEncodingOptimizationService: VideoEncodingOptimizationService;
  @Inject() sourcesService: SourcesService;
  @Inject() restreamService: RestreamService;
  @Inject() facebookService: FacebookService;

  @Prop() disabled: boolean;

  get isMidStream() {
    return this.streamingService.view.isMidStreamMode;
  }

  async toggleStreaming() {
    if (this.streamingService.isStreaming) {
      this.streamingService.toggleStreaming();
    } else {
      if (this.mediaBackupService.globalSyncStatus === EGlobalSyncStatus.Syncing) {
        const goLive = await electron.remote.dialog
          .showMessageBox(electron.remote.getCurrentWindow(), {
            title: $t('Cloud Backup'),
            type: 'warning',
            message:
              $t('Your media files are currently being synced with the cloud. ') +
              $t('It is recommended that you wait until this finishes before going live.'),
            buttons: [$t('Wait'), $t('Go Live Anyway')],
          })
          .then(({ response }) => !!response);

        if (!goLive) return;
      }

      const needToShowNoSourcesWarning =
        this.streamSettingsService.settings.warnNoVideoSources &&
        this.sourcesService.views
          .getSources()
          .filter(source => source.type !== 'scene' && source.video).length === 0;

      if (needToShowNoSourcesWarning) {
        const goLive = await electron.remote.dialog
          .showMessageBox(electron.remote.getCurrentWindow(), {
            title: $t('No Sources'),
            type: 'warning',
            message:
              // tslint:disable-next-line prefer-template
              $t(
                "It looks like you haven't added any video sources yet, so you will only be outputting a black screen.",
              ) +
              ' ' +
              $t('Are you sure you want to do this?') +
              '\n\n' +
              $t('You can add sources by clicking the + icon near the Sources box at any time'),
            buttons: [$t('Cancel'), $t('Go Live Anyway')],
          })
          .then(({ response }) => !!response);

        if (!goLive) return;
      }

      if (this.shouldShowGoLiveWindow()) {
        if (!this.streamingService.view.hasPendingChecks()) {
          this.streamingService.actions.resetInfo();
        }
        this.streamingService.actions.showGoLiveWindow();
      } else {
        this.streamingService.actions.goLive();
      }
    }
  }

  edit() {
    this.streamingService.actions.showEditStream();
  }

  get streamingStatus() {
    return this.streamingService.state.streamingStatus;
  }

  getStreamButtonLabel() {
    if (this.streamingStatus === EStreamingState.Live) {
      return $t('End Stream');
    }

    if (this.streamingStatus === EStreamingState.Starting) {
      if (this.streamingService.delayEnabled) {
        return `Starting ${this.streamingService.delaySecondsRemaining}s`;
      }

      return $t('Starting');
    }

    if (this.streamingStatus === EStreamingState.Ending) {
      if (this.streamingService.delayEnabled) {
        return `Discard ${this.streamingService.delaySecondsRemaining}s`;
      }

      return $t('Ending');
    }

    if (this.streamingStatus === EStreamingState.Reconnecting) {
      return $t('Reconnecting');
    }

    return $t('Go Live');
  }

  getIsRedButton() {
    return this.streamingStatus !== EStreamingState.Offline;
  }

  get isDisabled() {
    return (
      this.disabled ||
      (this.streamingStatus === EStreamingState.Starting &&
        this.streamingService.delaySecondsRemaining === 0) ||
      (this.streamingStatus === EStreamingState.Ending &&
        this.streamingService.delaySecondsRemaining === 0)
    );
  }

  @Watch('streamingStatus')
  setDelayUpdate() {
    this.$forceUpdate();

    if (this.streamingService.delaySecondsRemaining) {
      setTimeout(() => this.setDelayUpdate(), 100);
    }
  }

  shouldShowGoLiveWindow() {
    if (!this.userService.isLoggedIn) return false;
    const primaryPlatform = this.userService.state.auth?.primaryPlatform;
    const updateStreamInfoOnLive = this.customizationService.state.updateStreamInfoOnLive;

    if (primaryPlatform === 'twitch') {
      // For Twitch, we can show the Go Live window even with protected mode off
      // This is mainly for legacy reasons.
      return this.streamingService.view.isMultiplatformMode || updateStreamInfoOnLive;
    }

    if (primaryPlatform === 'facebook') {
      return (
        this.streamSettingsService.state.protectedModeEnabled &&
        this.streamSettingsService.isSafeToModifyStreamKey()
      );
    }

    if (primaryPlatform === 'youtube') {
      return (
        this.streamSettingsService.state.protectedModeEnabled &&
        this.streamSettingsService.isSafeToModifyStreamKey()
      );
    }

    if (primaryPlatform === 'tiktok') {
      return (
        this.streamSettingsService.state.protectedModeEnabled &&
        this.streamSettingsService.isSafeToModifyStreamKey()
      );
    }
  }
}
