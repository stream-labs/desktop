import TsxComponent from 'components/tsx-component';
import ModalLayout from 'components/ModalLayout.vue';
import { $t } from 'services/i18n';
import { Component } from 'vue-property-decorator';
import PlatformLogo from 'components/shared/PlatformLogo';
import styles from './GoLive.m.less';
import { Inject } from '../../services/core';
import { UserService } from 'services/user';
import { TPlatform } from '../../services/platforms';
import FormInput from 'components/shared/inputs/FormInput.vue';
import { ToggleInput } from '../shared/inputs/inputs';
import cx from 'classnames';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { formMetadata, metadata } from 'components/shared/inputs';
import { SettingsService } from 'services/settings';

@Component({})
export default class GoLiveWindow extends TsxComponent<{}> {
  @Inject() private userService: UserService;
  @Inject() private settingsService: SettingsService;

  private get userName() {
    return this.userService.username;
  }

  private isAdvancedMode = false;

  private platforms: { [key in TPlatform]: boolean } = {
    twitch: true,
    youtube: true,
    mixer: true,
    facebook: true,
  };

  private streamInfo = {
    title: '',
    description: '',
  };

  private get formMetadata() {
    return formMetadata({
      title: metadata.text({
        title: $t('Title'),
        fullWidth: true,
        required: true,
      }),
      description: metadata.textArea({
        title: $t('Description'),
        fullWidth: true,
      }),
    });
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private showManagePlatforms() {
    this.settingsService.showSettings('Stream');
  }

  render() {
    return (
      <ModalLayout customControls={true} showControls={false}>
        <div slot="content" class="flex">
          <div class="margin-right--20" style={{ width: '400px' }}>
            {Object.keys(this.platforms).map((platform: TPlatform) =>
              this.renderPlatformSwitcher(platform),
            )}
            <a href="#" class={styles.managePlatformsLink} onclick={this.showManagePlatforms}>
              {$t('Manage Platforms')}
            </a>
          </div>
          <div style={{ width: '100%' }}>
            {this.renderGeneralForm()}
            <button class="button button--default">Show More</button>
          </div>
        </div>

        <div slot="controls" class="controls">
          <button class="button button--default">{$t('Cancel')}</button>
          <button class="button button--action">Go Live</button>
        </div>
      </ModalLayout>
    );
  }

  private renderPlatformSwitcher(platform: TPlatform) {
    const disabled = !this.platforms[platform];
    return (
      <div class={cx(styles.platformSwitcher, { [styles.platformDisabled]: disabled })}>
        <div class={styles.colInput}>
          <ToggleInput vModel={this.platforms[platform]} />
        </div>
        <div class="logo margin-right--20">
          <PlatformLogo platform={platform} class={styles[`platform-logo-${platform}`]} />
        </div>
        <div class="account">
          <span class={styles.platformName}>{this.capitalize(platform)}</span> <br />
          {this.userName} <br />
        </div>
      </div>
    );
  }

  private renderGeneralForm() {
    return this.renderSection(
      <div>
        <HFormGroup vModel={this.streamInfo.title} metadata={this.formMetadata.title} />
        <HFormGroup vModel={this.streamInfo.description} metadata={this.formMetadata.description} />
      </div>,
    );
  }

  private renderSection(el: JSX.Element, title?: string) {
    return (
      <div class="section">
        {title && <h1 class="section-title section-title--dropdown">{title}</h1>}
        <div class={{ 'section-content': true, 'section-content--opened': !!title }}>{el}</div>
      </div>
    );
  }
}
