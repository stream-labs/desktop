import { Component } from 'vue-property-decorator';
import TsxComponent, { createProps } from 'components/tsx-component';
import electron from 'electron';
import { OnboardingStep } from 'streamlabs-beaker';
import { Inject } from 'services';
import { UserService } from 'services/user';
import { NavigationService } from 'services/navigation';
import { $t } from 'services/i18n';
import { RestreamService } from 'services/restream';
import { StreamSettingsService } from 'services/settings/streaming';
import { ToggleInput } from 'components/shared/inputs/inputs';
import styles from './Multistream.m.less';

class MultistreamProps {
  continue: () => void = () => {};
}

@Component({ props: createProps(MultistreamProps) })
export default class Multistream extends TsxComponent<MultistreamProps> {
  @Inject() userService: UserService;
  @Inject() navigationService: NavigationService;
  @Inject() restreamService: RestreamService;
  @Inject() streamSettingsService: StreamSettingsService;

  showLogin = false;
  multistreamEnabled = false;
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
        this.streamSettingsService.setSettings({ protectedModeEnabled: true });
        this.props.continue();
      },
      true,
    );
  }

  setMultistream(val: boolean) {
    if (!this.restreamService.canEnableRestream) return;
    this.restreamService.setEnabled(val);
    this.multistreamEnabled = val;
  }

  get enableStep() {
    return (
      <div class={styles.cell}>
        <div>
          <b>
            1) {$t('Enable multistream')}
            <ToggleInput
              value={this.multistreamEnabled}
              onInput={(val: boolean) => this.setMultistream(val)}
            />
          </b>
          {$t('Enable multistream to get started.')}
        </div>
      </div>
    );
  }

  get createPageStep() {
    return (
      <div class={styles.cell}>
        <div>
          <b>2) {$t('Create Facebook Gaming Page')}</b>
          {$t('A Facebook Gaming Page is required to multistream to Facebook.')}
        </div>
        <button
          class={`button button--facebook ${styles.button}`}
          onClick={() => this.openPageCreation()}
          disabled={this.showLogin}
        >
          {$t('Create Gaming Video Creator Page')}
        </button>
      </div>
    );
  }

  get loginStep() {
    return (
      <div class={styles.cell}>
        <div>
          <b>3) {$t('Merge your Facebook Gaming Page')}</b>
          {$t(
            'Merge your account with your new page. We can then track your progress so you can start earning great rewards!',
          )}
        </div>
        <button
          class={`button button--facebook ${styles.button}`}
          disabled={this.loading}
          onClick={() => this.mergeFacebook()}
        >
          <i class={this.loading ? 'fas fa-spinner fa-spin' : 'fab fa-facebook'} />
          {$t('Merge with Facebook')}
        </button>
      </div>
    );
  }

  render() {
    return (
      <OnboardingStep>
        <template slot="title">{$t('Multistream')}</template>
        <template slot="desc">
          {$t(
            'Enable multistream to grow your audience, build your brand, and earn great prizes - with no extra effort. Available for Facebook today, and other platforms coming soon.',
          )}
        </template>
        {this.enableStep}
        {this.multistreamEnabled && this.createPageStep}
        {this.multistreamEnabled && this.showLogin && this.loginStep}
      </OnboardingStep>
    );
  }
}
