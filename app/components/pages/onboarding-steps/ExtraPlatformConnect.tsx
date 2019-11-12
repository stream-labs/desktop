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
import electron from 'electron';

export class ConnectProps {
  platform = '';
  continue: () => void = () => {};
  back: () => void = () => {};
}

@Component({ props: createProps(ConnectProps) })
export default class ExtraPlatformConnect extends TsxComponent<ConnectProps> {
  @Inject() private onboardingService: OnboardingService;
  @Inject() private userService: UserService;
  @Inject() private streamSettingsService: StreamSettingsService;
  keyMetadata = metadata.text({ title: $t('Stream Key'), masked: true });
  key = '';
  platformDefinitions = {
    dlive: {
      name: 'DLive',
      ingestUrl: 'rtmp://stream.dlive.tv/live',
      helpUrl: 'https://go.dlive.tv/stream',
    },
    nimotv: {
      name: 'Nimo.TV',
      ingestUrl: 'rtmp://txpush.rtmp.nimo.tv/live/',
      helpUrl: 'https://article.nimo.tv/p/1033/streamlabsprotocol.html',
    },
  };

  get platformDefinition() {
    console.log('get platform', this.props.platform);
    return this.platformDefinitions[this.props.platform];
  }

  next() {
    this.streamSettingsService.setSettings({ key: this.key });
    this.props.continue();
  }

  openHelp() {
    electron.remote.shell.openExternal(this.platformDefinition.helpUrl);
  }

  render() {
    return (
      <div class={styles.container}>
        <h1>{$t('Connect to %platform%', { platform: this.platformDefinition.name })}</h1>
        <p>
          {$t('Enter your stream key')}

          <a href="javascript:void 0" onCLick={() => this.openHelp()}>
            {$t('View help docs')}
          </a>
        </p>

        <div class="section">
          <VFormGroup vModel={this.key} metadata={this.keyMetadata} />
        </div>

        {!!this.key.trim().length && (
          <button class="button button--dlive" onClick={() => this.next()}>
            {$t('Finish')}
          </button>
        )}

        <p class={styles.skipButton} onClick={this.props.continue}>
          <br />
          {$t('Skip')}
        </p>
        <p class={styles.skipButton} onClick={() => this.props.back()}>
          <br />
          {$t('Back')}
        </p>
      </div>
    );
  }
}
