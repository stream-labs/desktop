import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { StreamingService, EStreamingState } from 'services/streaming';
import { Inject } from 'util/injector';
import { NavigationService } from 'services/navigation';
import { UserService } from 'services/user';
import { CustomizationService } from 'services/customization';
import { SettingsService } from 'services/settings';
import { getPlatformService } from '../services/platforms';
import { NiconicoService } from '../services/platforms/niconico';
import { WindowsService } from '../services/windows';
import electron from 'electron';
import { $t } from 'services/i18n';
const StartStreamingIcon = require('../../media/images/start-streaming-icon.svg');

@Component({
  components: {
    StartStreamingIcon
  }
})
export default class StartStreamingButton extends Vue {
  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() navigationService: NavigationService;
  @Inject() settingsService: SettingsService;
  @Inject() windowsService: WindowsService;

  @Prop() disabled: boolean;

  async toggleStreaming() {
    if (this.streamingService.isStreaming) {
      this.streamingService.toggleStreaming();
      return;
    }

    console.log('Start Streaming button: platform=' + JSON.stringify(this.userService.platform));
    if (this.userService.isNiconicoLoggedIn()) {
      try {
        const streamkey = await this.userService.updateStreamSettings();
        if (streamkey === '') {
          return new Promise(resolve => {
            electron.remote.dialog.showMessageBox(
              electron.remote.getCurrentWindow(),
              {
                title: $t('streaming.notBroadcasting'),
                type: 'warning',
                message: $t('streaming.notBroadcastingMessage'),
                buttons: [$t('common.close')],
                noLink: true,
              },
              done => resolve(done)
            );
          });
        }
        if (this.customizationService.optimizeForNiconico) {
          const platform = getPlatformService(this.userService.platform.type);
          if (platform instanceof NiconicoService) {
            // FIXME: `this.userService.updateStreamSettings`とあわせて
            //       2度 `getpublishstatus` を呼んでいるが
            //       不整合回避のために1回だけにしたい
            return this.optimizeForNiconico(platform);
          }
        }
      } catch (e) {
        const message = e instanceof Response
          ? $t('streaming.broadcastStatusFetchingError.httpError', { statusText: e.statusText })
          : $t('streaming.broadcastStatusFetchingError.default');

        return new Promise(resolve => {
          electron.remote.dialog.showMessageBox(
            electron.remote.getCurrentWindow(),
            {
              type: 'warning',
              message,
              buttons: [$t('common.close')],
              noLink: true,
            },
            done => resolve(done)
          );
        });
      }
    }

    this.streamingService.toggleStreaming();
  }

  private async optimizeForNiconico(platform: NiconicoService) {
    const bitrate = await platform.fetchBitrate();
    if (bitrate === undefined) {
      return new Promise(resolve => {
        electron.remote.dialog.showMessageBox(
          electron.remote.getCurrentWindow(),
          {
            title: $t('streaming.bitrateFetchingError.title'),
            type: 'warning',
            message: $t('streaming.bitrateFetchingError.message'),
            buttons: [$t('common.close')],
            noLink: true,
          },
          done => resolve(done)
        );
      });
    }
    const settings = this.settingsService.diffOptimizedSettings(bitrate);
    if (settings) {
      if (this.customizationService.showOptimizationDialogForNiconico) {
        this.windowsService.showWindow({
          componentName: 'OptimizeForNiconico',
          queryParams: settings,
          size: {
            width: 500,
            height: 400
          }
        });
      } else {
        this.settingsService.optimizeForNiconico(settings);
        this.streamingService.toggleStreaming();
      }
    } else {
      this.streamingService.toggleStreaming();
    }
  }

  get streamingStatus() {
    return this.streamingService.state.streamingStatus;
  }

  getStreamButtonLabel() {
    if (this.streamingStatus === EStreamingState.Live) {
      return $t('streaming.endStream');
    }

    if (this.streamingStatus === EStreamingState.Starting) {
      if (this.streamingService.delayEnabled) {
        return $t('streaming.startingWithDelay', { delaySeconds: this.streamingService.delaySecondsRemaining });
      }

      return $t('streaming.starting');
    }

    if (this.streamingStatus === EStreamingState.Ending) {
      if (this.streamingService.delayEnabled) {
        return $t('streaming.endingWithDelay', { delaySeconds: this.streamingService.delaySecondsRemaining });
      }

      return $t('streaming.ending');
    }

    if (this.streamingStatus === EStreamingState.Reconnecting) {
      return $t('streaming.reconnecting');
    }

    return $t('streaming.goLive');
  }

  getIsRedButton() {
    return this.streamingStatus !== EStreamingState.Offline;
  }

  get isStreaming() {
    return this.streamingService.isStreaming;
  }

  get isDisabled() {
    return this.disabled ||
      ((this.streamingStatus === EStreamingState.Starting) && (this.streamingService.delaySecondsRemaining === 0)) ||
      ((this.streamingStatus === EStreamingState.Ending) && (this.streamingService.delaySecondsRemaining === 0));
  }

  @Watch('streamingStatus')
  setDelayUpdate() {
    this.$forceUpdate();

    if (this.streamingService.delaySecondsRemaining) {
      setTimeout(() => this.setDelayUpdate(), 100);
    }
  }
}
