import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { ISettingsSubCategory } from 'services/settings';
import TsxComponent from 'components/tsx-component';
import { StreamSettingsService } from '../../../services/settings/streaming';
import GenericFormGroups from '../../obs/inputs/GenericFormGroups.vue';
import { UserService } from 'services/user';
import styles from './StreamSettings.m.less';
import PlatformLogo from 'components/shared/PlatformLogo';
import { RestreamService } from 'services/restream';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { metadata } from 'components/shared/inputs';
import { NavigationService } from 'services/navigation';
import { WindowsService } from 'services/windows';
import { EStreamingState, StreamingService } from 'services/streaming';
import BrowserView from 'components/shared/BrowserView';

@Component({ components: { GenericFormGroups, PlatformLogo, BrowserView } })
export default class StreamSettings extends TsxComponent {
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private userService: UserService;
  @Inject() private restreamService: RestreamService;
  @Inject() private navigationService: NavigationService;
  @Inject() private windowsService: WindowsService;
  @Inject() private streamingService: StreamingService;

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
    return this.userService.platform.username;
  }

  get platform() {
    return this.userService.platform.type;
  }

  get platformName() {
    return this.formattedPlatformName(this.platform);
  }

  formattedPlatformName(platform: string) {
    return platform.charAt(0).toUpperCase() + this.platform.slice(1);
  }

  get needToShowWarning() {
    return this.userService.isLoggedIn() && !this.protectedModeEnabled;
  }

  get canEditSettings() {
    return this.streamingService.state.streamingStatus === EStreamingState.Offline;
  }

  get restreamEnabled() {
    return this.restreamService.state.enabled;
  }

  set restreamEnabled(enabled: boolean) {
    this.restreamService.setEnabled(enabled);
  }

  facebookMerge() {
    this.navigationService.navigate('FacebookMerge');
    this.windowsService.closeChildWindow();
  }

  get restreamRewardsUrl() {
    return `https://streamlabs.com/multistream-rewards?token=${this.userService.apiToken}`;
  }

  render() {
    return (
      <div>
        {/* account info */}
        {this.protectedModeEnabled && (
          <div>
            {this.restreamService.canEnableRestream && (
              <div class="section">
                <VFormGroup
                  vModel={this.restreamEnabled}
                  metadata={metadata.toggle({
                    title: $t('Enable Multistream'),
                    disabled: !this.canEditSettings,
                    description: $t(
                      'Multistream allows you to stream to multiple platforms simultaneously.',
                    ),
                  })}
                />
              </div>
            )}
            <div class="section flex">
              <div class="margin-right--20">
                <PlatformLogo platform={this.platform} class={styles.platformLogo} />
              </div>
              <div>
                {$t('Streaming to %{platformName}', { platformName: this.platformName })} <br />
                {this.userName} <br />
              </div>
            </div>
            {this.restreamEnabled && (
              <div class="section flex">
                <div class="margin-right--20">
                  <PlatformLogo platform={'facebook'} class={styles.platformLogo} />
                </div>
                {this.userService.state.auth.platforms.facebook ? (
                  <div>
                    {$t('Streaming to %{platformName}', { platformName: 'facebook' })} <br />
                    {this.userService.state.auth.platforms.facebook.username} <br />
                  </div>
                ) : (
                  <div style={{ lineHeight: '42px' }}>
                    {this.canEditSettings && (
                      <button onClick={this.facebookMerge} class="button button--facebook">
                        {$t('Connect')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {this.canEditSettings && (
              <div>
                <a onClick={this.disableProtectedMode}>{$t('Stream to custom ingest')}</a>
              </div>
            )}
          </div>
        )}

        {this.restreamService.canEnableRestream && this.protectedModeEnabled && (
          <BrowserView
            style={{ height: '330px', marginTop: '16px', marginBottom: '16px' }}
            src={this.restreamRewardsUrl}
          />
        )}

        {/* WARNING messages */}
        {!this.canEditSettings && (
          <div class="section section--warning">
            {$t("You can not change these settings when you're live")}
          </div>
        )}
        {this.needToShowWarning && (
          <div class="section section--warning">
            <b>{$t('Warning')}: </b>
            {$t(
              'Streaming to a custom ingest is advanced functionality. Some features of Streamlabs OBS may stop working as expected',
            )}
            <br />
            <br />

            {this.canEditSettings && (
              <button class="button button--warn" onClick={this.restoreDefaults}>
                {$t('Use recommended settings')}
              </button>
            )}
          </div>
        )}

        {/* OBS settings */}
        {!this.protectedModeEnabled && this.canEditSettings && (
          <GenericFormGroups value={this.obsSettings} onInput={this.saveObsSettings} />
        )}
      </div>
    );
  }
}
