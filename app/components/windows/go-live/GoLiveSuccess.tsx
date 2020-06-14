import TsxComponent from 'components/tsx-component';
import { Inject } from 'services/core';
import { StreamingService, TGoLiveChecklistItemState } from 'services/streaming';
import { WindowsService } from '../../../services/windows';
import { StreamInfoDeprecatedService } from '../../../services/stream-info-deprecated';
import { $t } from 'services/i18n';
import { Component } from 'vue-property-decorator';
import styles from './GoLiveChecklist.m.less';
import cx from 'classnames';
import { YoutubeService } from '../../../services/platforms/youtube';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import electron from 'electron';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import TextInput from 'components/shared/inputs/TextInput';
import Utils from '../../../services/utils';
import { Twitter } from '../../Twitter';
import { TwitterService } from '../../../services/integrations/twitter';

/**
 * Shows
 */
@Component({})
export default class GoLiveSuccess extends TsxComponent<{}> {
  @Inject() private streamingService: StreamingService;
  @Inject() private windowsService: WindowsService;
  @Inject() private twitterService: TwitterService;

  private confirmationCopyMessage = '';
  private tweetModel = '';

  private copyToClipboard(url: string, confirmMessage: string) {
    Utils.copyToClipboard(url);
    this.confirmationCopyMessage = confirmMessage;
  }

  private get view() {
    return this.streamingService.views;
  }

  private openLink(url: string) {
    electron.remote.shell.openExternal(url);
  }

  private render() {
    return (
      <div>
        {/* LINKS LIST */}
        <div class={styles.linksContainer}>
          {this.view.enabledPlatforms.map(platform => {
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

        {/* CONFIRMATION MESSAGE FOR CLIPBOARD */}
        {this.confirmationCopyMessage && (
          <p style={{ textAlign: 'center' }}>{this.confirmationCopyMessage}</p>
        )}

        {/* TWITTER */}
        {this.twitterService.isEnabled && (
          <Twitter
            streamTitle={this.view.info.goLiveSettings.commonFields.title}
            vModel={this.tweetModel}
          />
        )}
      </div>
    );
  }
}
