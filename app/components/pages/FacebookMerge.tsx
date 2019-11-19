import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import electron from 'electron';
import { Inject } from 'services';
import { UserService } from 'services/user';
import { NavigationService } from 'services/navigation';
import { $t } from 'services/i18n';
import { RestreamService } from 'services/restream';
import { StreamSettingsService } from 'services/settings/streaming';

@Component({})
export default class FacebookMerge extends TsxComponent<{}> {
  @Inject() userService: UserService;
  @Inject() navigationService: NavigationService;
  @Inject() restreamService: RestreamService;
  @Inject() streamSettingsService: StreamSettingsService;

  showLogin = false;
  loading = false;

  openPageCreation() {
    electron.remote.shell.openExternal(
      'https://www.facebook.com/gaming/pages/create?ref=streamlabs',
    );
    this.showLogin = true;
  }

  mergeFacebook() {
    this.loading = true;
    this.userService.startAuth(
      'facebook',
      () => (this.loading = false),
      () => (this.loading = true),
      () => {
        this.restreamService.setEnabled(true);
        this.streamSettingsService.setSettings({ protectedModeEnabled: true });
        this.navigationService.navigate('Studio');
      },
      true,
    );
  }

  get createPageStep() {
    return (
      <div>
        <div>
          <b>{$t('Step')} 1:</b> {$t('Create a Facebook Gaming page to get started.')}
        </div>
        <button
          style={{ marginTop: '24px' }}
          class="button button--action"
          onClick={() => this.openPageCreation()}
        >
          {$t('Create a Gaming Page')}
        </button>
      </div>
    );
  }

  get loginStep() {
    return (
      <div>
        <div>
          <b>{$t('Step')} 2:</b> {$t('Connect Facebook to Streamlabs OBS.')}
          <br />
          {$t('All of your scenes, sources, and settings will be preserved.')}
        </div>
        <button
          style={{ marginTop: '24px' }}
          class="button button--facebook"
          disabled={this.loading}
          onClick={() => this.mergeFacebook()}
        >
          <i class={this.loading ? 'fas fa-spinner fa-spin' : 'fab fa-facebook'} />
          {$t('Connect Facebook')}
        </button>
      </div>
    );
  }

  render() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '400px' }}>
          <h1>{$t('Multistream To Facebook')}</h1>
          {this.showLogin ? this.loginStep : this.createPageStep}
        </div>
      </div>
    );
  }
}
