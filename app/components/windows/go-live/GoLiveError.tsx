import TsxComponent, { createProps } from '../../tsx-component';
import { Inject } from '../../../services/core';
import { StreamingService, TGoLiveChecklistItemState } from '../../../services/streaming';
import { WindowsService } from '../../../services/windows';
import { $t } from 'services/i18n';
import { Component } from 'vue-property-decorator';
import styles from './GoLiveError.m.less';
import cx from 'classnames';
import { YoutubeService } from '../../../services/platforms/youtube';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import { TwitterService } from '../../../services/integrations/twitter';
import { IStreamError } from '../../../services/streaming/stream-error';
import Translate from '../../shared/translate';
import electron from 'electron';

/**
 * Shows error and troubleshooting suggestions
 */
@Component({})
export default class GoLiveError extends TsxComponent<{}> {
  @Inject() private streamingService: StreamingService;
  @Inject() private windowsService: WindowsService;
  @Inject() private youtubeService: YoutubeService;
  @Inject() private twitterService: TwitterService;

  private get view() {
    return this.streamingService.views;
  }

  private get error() {
    return this.view.info.error;
  }

  private getPlatformDisplayName(platform: TPlatform): string {
    return getPlatformService(platform).displayName;
  }

  private goToYoutubeDashboard() {
    electron.remote.shell.openExternal(this.youtubeService.state.dashboardUrl);
  }

  private render() {
    const error = this.view.info.error;
    if (!error) return;
    switch (error.type) {
      case 'PREPOPULATE_FAILED':
        return this.renderPrepopulateError(error);
      case 'RESTREAM_DISABLED':
      case 'RESTREAM_SETUP_FAILED':
        return this.renderRestreamError(error);
      case 'YOUTUBE_PUBLISH_FAILED':
        return this.renderYoutubePublishError(error);
    }
  }

  private renderPrepopulateError(error: IStreamError) {
    const platformName = getPlatformService(error.platform).displayName;
    return (
      <ErrorLayout
        error={error}
        message={$t('Can not fetch settings from %{platformName}', { platformName })}
      >
        <Translate
          message={$t('goLiveError')}
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
              <a class={styles.link} onclick={() => this.streamingService.actions.goLive()}>
                {{ text }}
              </a>
            ),
          }}
        />
      </ErrorLayout>
    );
  }

  private renderRestreamError(error: IStreamError) {
    return (
      <ErrorLayout error={error}>
        {$t('You could try reducing the number of your destinations to one for direct streaming.')}
      </ErrorLayout>
    );
  }

  private renderYoutubePublishError(error: IStreamError) {
    return (
      <ErrorLayout error={error}>
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
      </ErrorLayout>
    );
  }
}

class ErrorLayoutProps {
  error: IStreamError = null;
  /**
   * overrides the error message if provided
   */
  message?: string = '';
}

/**
 * Layout for displaying an single error
 */
@Component({ props: createProps(ErrorLayoutProps) })
class ErrorLayout extends TsxComponent<ErrorLayoutProps> {
  private isErrorDetailsShown = false;

  private render() {
    const error = this.props.error;
    const message = this.props.message || error.message;
    const details = error.details;
    return (
      <div class={cx('section selectable', styles.container)}>
        <p class={styles.title}>
          <i class="fa fa-warning" /> {message}
        </p>
        <p>{this.$slots.default}</p>

        {details && !this.isErrorDetailsShown && (
          <p style={{ textAlign: 'right' }}>
            <a class={styles.link} onclick={() => (this.isErrorDetailsShown = true)}>
              {$t('Show details')}
            </a>
          </p>
        )}
        {details && this.isErrorDetailsShown && <p class={styles.error}>{details}</p>}
      </div>
    );
  }
}
