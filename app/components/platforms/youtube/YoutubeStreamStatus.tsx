import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { WindowsService } from 'services/windows';
import ModalLayout from 'components/ModalLayout.vue';
import { $t } from 'services/i18n';
import { StreamInfoService } from 'services/stream-info';
import SmoothProgressBar from 'components/shared/SmoothProgressBar';
import PlatformLogo from 'components/shared/PlatformLogo';
import TsxComponent from 'components/tsx-component';
import styles from './YoutubeStreamStatus.m.less';
import { TYoutubeLifecycleStep } from 'services/platforms/youtube';
import { StreamingService } from 'services/streaming';

/**
 * This component is responsible for showing progress for YT
 * Also it shows error messages
 */
@Component({})
export default class YoutubeStreamStatus extends TsxComponent {
  @Inject() private windowsService: WindowsService;
  @Inject() private streamInfoService: StreamInfoService;
  @Inject() private streamingService: StreamingService;

  private errorDetailsVisible = false;

  get streamInfo() {
    return this.streamInfoService.state;
  }

  get progressInfo(): { msg: string; progress: number } {
    let dictionary: { [key in TYoutubeLifecycleStep]: { msg: string; progress: number } };
    dictionary = {
      idle: {
        msg: '',
        progress: 0,
      },
      waitForStreamToBeActive: {
        msg: $t('Waiting for Youtube to start receiving the video...'),
        progress: 0.1,
      },

      transitionBroadcastToTesting: {
        msg: $t('Start testing the broadcast...'),
        progress: 0.3,
      },
      waitForTesting: {
        msg: $t('Wait testing to be finished...'),
        progress: 0.4,
      },
      transitionBroadcastToActive: {
        msg: $t('Publish the broadcast to the channel...'),
        progress: 0.5,
      },
      waitForBroadcastToBeLive: {
        msg: $t('Waiting broadcast to be published...'),
        progress: 0.6,
      },
      live: {
        msg: $t('Your all set'),
        progress: 1,
      },
    };
    return dictionary[this.streamInfo.lifecycleStep];
  }

  get error(): string {
    return this.streamInfoService.state.error;
  }

  stopStreaming() {
    this.streamingService.toggleStreaming();
    this.windowsService.closeChildWindow();
  }

  created() {
    this.streamInfoService.streamInfoChanged.subscribe(async info => {
      if (info.lifecycleStep === 'live') {
        await new Promise(r => setTimeout(r, 2000));
        this.windowsService.closeChildWindow();
      }
    });
  }

  render() {
    return (
      <ModalLayout showControls={false}>
        <div slot="content">
          {/* everything is good*/}
          {!this.error && (
            <div class={styles.content}>
              <h1>{$t('Working on your live stream')}</h1>
              <p>{$t('Your stream will start shortly. You can close this window.')}</p>
              <div class="flex">
                <PlatformLogo platform="youtube" size={150} class={styles.logo} />
              </div>
              <p>{this.progressInfo.msg}</p>
              <SmoothProgressBar value={this.progressInfo.progress} timeLimit={60 * 1000} />
            </div>
          )}

          {/* error state*/}
          {this.error && (
            <div class={styles.content}>
              <h1>{$t('Something went wrong')}</h1>
              <p class={styles.error}>
                {$t(
                  `Your stream has been created but we can\'t publish it in your channel. Check your internet connection or go to the `,
                )}
                <a href={this.streamInfo.dashboardUrl}>{$t('stream control page')}</a>
                {$t(' to publish it manually')}
              </p>

              {!this.errorDetailsVisible && (
                <a href="javascript:void(0)" onClick={() => (this.errorDetailsVisible = true)}>
                  {$t('Show details')}
                </a>
              )}

              {this.errorDetailsVisible && <p class={styles.error}>{this.error}</p>}

              <br />
              <br />
              <button class="button button--warn" onClick={this.stopStreaming}>
                {$t('Stop Streaming')}
              </button>
            </div>
          )}
        </div>
      </ModalLayout>
    );
  }
}
