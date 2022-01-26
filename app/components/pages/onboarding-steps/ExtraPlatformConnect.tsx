import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { OnboardingService } from 'services/onboarding';
import TsxComponent, { createProps } from 'components/tsx-component';
import { $t } from 'services/i18n';
import styles from './Connect.m.less';
import { UserService } from 'services/user';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { metadata } from 'components/shared/inputs';
import { StreamSettingsService } from 'services/settings/streaming';
import PlatformLogo from 'components/shared/PlatformLogo';
import * as remote from '@electron/remote';

export type TExtraPlatform = 'nimotv' | 'dlive';

export class ConnectProps {
  platform: 'nimotv' | 'dlive' = 'dlive';
  continue: () => void = () => {};
  back: () => void = () => {};
}

@Component({ props: createProps(ConnectProps) })
export default class ExtraPlatformConnect extends TsxComponent<ConnectProps> {
  @Inject() private onboardingService: OnboardingService;
  @Inject() private userService: UserService;
  @Inject() private streamSettingsService: StreamSettingsService;
  keyMetadata = metadata.text({ title: $t('Stream Key'), name: 'key', masked: true });
  key = '';
  platformDefinitions = {
    dlive: {
      name: 'DLive',
      ingestUrl: 'rtmp://stream.dlive.tv/live',
      helpUrl: 'https://go.dlive.tv/stream',
      icon: 'dlive-white.png',
    },
    nimotv: {
      name: 'Nimo.TV',
      ingestUrl: 'rtmp://txpush.rtmp.nimo.tv/live/',
      helpUrl: 'https://article.nimo.tv/p/1033/streamlabsprotocol.html',
      icon: 'nimo-logo.png',
    },
  };

  get platformDefinition() {
    return this.platformDefinitions[this.props.platform];
  }

  next() {
    this.streamSettingsService.setSettings({
      key: this.key,
      streamType: 'rtmp_custom',
      server: this.platformDefinition.ingestUrl,
    });
    this.props.continue();
  }

  openHelp() {
    remote.shell.openExternal(this.platformDefinition.helpUrl);
  }

  render() {
    return (
      <div>
        <div class={styles.container} style={{ height: '50%' }}>
          <p>
            <PlatformLogo platform={this.props.platform} />
          </p>
          <h1>{$t('Connect to %{platform}', { platform: this.platformDefinition.name })}</h1>
          <p>
            {$t('Enter your stream key.')}
            &nbsp;
            <span class={styles['link-button']} onClick={() => this.openHelp()}>
              {$t('View help docs')}
            </span>
          </p>

          <div class="section">
            <VFormGroup vModel={this.key} metadata={this.keyMetadata} />
          </div>

          {!!this.key.trim().length && (
            <p>
              <button class={`button button--${this.props.platform}`} onClick={() => this.next()}>
                {$t('Finish')}
              </button>
            </p>
          )}

          <p>
            <a class={styles['link-button']} onClick={this.props.continue}>
              {$t('Skip')}
            </a>

            <span style="display: inline-block; width: 32px"> </span>

            <a class={styles['link-button']} onClick={() => this.props.back()}>
              {$t('Back')}
            </a>
          </p>
        </div>
      </div>
    );
  }
}
