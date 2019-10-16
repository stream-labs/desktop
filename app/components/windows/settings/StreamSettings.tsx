import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import cx from 'classnames';
import { $t } from 'services/i18n';
import { ISettingsSubCategory } from 'services/settings';
import TsxComponent from 'components/tsx-component';
import { StreamSettingsService } from '../../../services/settings/streaming';
import GenericFormGroups from '../../obs/inputs/GenericFormGroups.vue';
import { UserService } from 'services/user';
import styles from './StreamSettings.m.less';
import PlatformLogo from 'components/shared/PlatformLogo';

@Component({ components: { GenericFormGroups, PlatformLogo } })
export default class StreamSettings extends TsxComponent {
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private userService: UserService;
  private obsSettings = this.streamSettingsService.getObsStreamSettings();

  saveObsSettings(obsSettings: ISettingsSubCategory[]) {
    this.streamSettingsService.setObsStreamSettings(obsSettings);
    this.obsSettings = this.streamSettingsService.getObsStreamSettings();
  }

  disableProtectedMode() {
    this.streamSettingsService.setSettings({ protectedModeEnabled: false });
  }

  restoreDefaults() {
    this.streamSettingsService.resetStreamSettings();
  }

  get protectedModeEnabled(): boolean {
    return this.streamSettingsService.protectedModeEnabled;
  }

  get userName() {
    return this.userService.state.auth.platform.username;
  }

  get platform() {
    return this.userService.state.auth.platform.type;
  }

  get platformName() {
    return this.platform.charAt(0).toUpperCase() + this.platform.slice(1);
  }

  get needToShowWarning() {
    return this.userService.isLoggedIn() && !this.protectedModeEnabled;
  }

  render() {
    return (
      <div>
        {/* account info */}
        {this.protectedModeEnabled && (
          <div>
            <div class="section flex">
              <div class="margin-right--20">
                <PlatformLogo platform={this.platform} class={styles.platformLogo} />
              </div>
              <div>
                {$t('Streaming to %{platformName}', { platformName: this.platformName })} <br />
                {this.userName} <br />
              </div>
            </div>
            <div>
              <a onClick={this.disableProtectedMode}>{$t('Stream to custom ingest')}</a>
            </div>
          </div>
        )}

        {/* WARNING message */}
        {this.needToShowWarning && (
          <div class="section section--warning">
            <b>{$t('Warning')}: </b>
            {$t('CUSTOM_INGEST_WARN')}
            <br />
            <br />
            <button class="button button--warn" onClick={this.restoreDefaults}>
              {$t('Use recommended settings')}
            </button>
          </div>
        )}

        {/* OBS settings */}
        {!this.protectedModeEnabled && (
          <GenericFormGroups value={this.obsSettings} onInput={this.saveObsSettings} />
        )}
      </div>
    );
  }
}
