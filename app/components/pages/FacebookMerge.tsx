import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import electron from 'electron';
import { Inject } from 'services';
import { UserService } from 'services/user';
import { NavigationService } from 'services/navigation';

@Component({})
export default class FacebookMerge extends TsxComponent<{}> {
  @Inject() userService: UserService;
  @Inject() navigationService: NavigationService;

  showLogin = false;
  loading = false;

  openPageCreation() {
    electron.remote.shell.openExternal(
      'https://www.facebook.com/gaming/pages/create?ref=streamlabs',
    );
    this.showLogin = true;
  }

  mergeFacebook() {
    console.log('Starting FB merge');
    this.loading = true;
    this.userService.startAuth(
      'facebook',
      () => (this.loading = false),
      () => (this.loading = true),
      () => {
        this.navigationService.navigate('Studio');
      },
      true,
    );
  }

  createPageStep(h: Function) {
    return (
      <div>
        <div>
          <b>Step 1:</b> Create a Facebook Gaming page to get started.
        </div>
        <button
          style={{ marginTop: '24px' }}
          class="button button--action"
          onClick={() => this.openPageCreation()}
        >
          Create a Gaming Page
        </button>
      </div>
    );
  }

  loginStep(h: Function) {
    return (
      <div>
        <div>
          <b>Step 2:</b> Connect Facebook to Streamlabs OBS.
          <br />
          All of your scenes, sources, and settings will be preserved.
        </div>
        <button
          style={{ marginTop: '24px' }}
          class="button button--facebook"
          disabled={this.loading}
          onClick={() => this.mergeFacebook()}
        >
          <i class={this.loading ? 'fas fa-spinner fa-spin' : 'fab fa-facebook'} />
          Connect Facebook
        </button>
      </div>
    );
  }

  render(h: Function) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '400px' }}>
          <h1>Connect Facebook</h1>
          {this.showLogin ? this.loginStep(h) : this.createPageStep(h)}
        </div>
      </div>
    );
  }
}
