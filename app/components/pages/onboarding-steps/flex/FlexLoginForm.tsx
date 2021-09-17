import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { OnboardingService } from 'services/onboarding';
import { TPlatform, IUserAuth } from 'services/platforms';
import TsxComponent, { createProps } from 'components/tsx-component';
import { $t } from 'services/i18n';
import styles from '../Connect.m.less';
import { UserService } from 'services/user';
import { jfetch } from 'util/requests';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { metadata } from 'components/shared/inputs';
import { StreamSettingsService } from 'services/settings/streaming';
import electron from 'electron';
import PlatformLogo from 'components/shared/PlatformLogo';

export class ConnectProps {
  continue: () => void = () => {};
}

interface FlexAuthResult {
  nickname: string;
  token: string;
}

@Component({ props: createProps(ConnectProps) })
export default class FlexLoginForm extends TsxComponent<ConnectProps> {
  @Inject() private onboardingService: OnboardingService;
  @Inject() private userService: UserService;
  @Inject() private streamSettingsService: StreamSettingsService;
  keyMetadata = metadata.text({ title: $t('Stream Key'), name: 'key', masked: true });
  idMetadata = metadata.text({ title: '아이디', name: 'id' });
  pwdMetadata = metadata.text({ title: '비밀번호', name: 'password', masked: true });
  key = '';
  id = '';
  password = '';

  async next() {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const request = new Request('https://www.flextv.co.kr/api/auth/signin', {
      headers,
      method: 'POST',
      body: JSON.stringify({ loginId: this.id, password: this.password }),
    });
    const data: FlexAuthResult = await jfetch(request);
    console.log(data);
    const auth = this.parseAuthFromToken(data.token);

    return this.userService.startFlexAuth(auth);
  }

  private parseAuthFromToken(token: string): IUserAuth {
    return {
      widgetToken: token,
      apiToken: token,
      primaryPlatform: 'flextv' as TPlatform,
      platforms: {},
      hasRelogged: true,
    };
  }

  openHelp() {
    electron.remote.shell.openExternal('https://www.flextv.co.kr/cs/guide');
  }

  render() {
    return (
      <div>
        <div class={styles.container} style={{ height: '50%' }}>
          <p>
            <PlatformLogo platform={'flextv'} />
          </p>
          <h1>FlexTV에 연결하기</h1>

          <div class="section">
            <VFormGroup vModel={this.id} metadata={this.idMetadata} />
            <VFormGroup vModel={this.password} metadata={this.pwdMetadata} />
          </div>

          <p>
            <button className={'button button-flex'} onClick={() => this.next()}>
              {$t('Finish')}
            </button>
            <a class={styles['link-button']} onClick={() => this.props.continue()}>
              {$t('Back')}
            </a>
          </p>
        </div>
      </div>
    );
  }
}
