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
import { getPlatformService, TPlatform } from '../../../services/platforms';
import cx from 'classnames';

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

  get streamingView() {
    return this.streamingService.views;
  }

  get needToShowWarning() {
    return this.userService.isLoggedIn && !this.protectedModeEnabled;
  }

  get canEditSettings() {
    return this.streamingService.state.streamingStatus === EStreamingState.Offline;
  }

  private platformMerge(platform: TPlatform) {
    if (this.restreamService.canEnableRestream) {
      this.navigationService.navigate('PlatformMerge', { platform });
      this.windowsService.actions.closeChildWindow();
    } else {
      this.userService.openPrimeUrl('slobsmultistream');
    }
  }

  private platformUnlink(platform: TPlatform) {
    getPlatformService(platform).unlink();
  }

  render() {
    const platforms = this.streamingView.allPlatforms;
    return (
      <div>
        {/* account info */}
        {this.protectedModeEnabled && (
          <div>
            {platforms.map(platform => this.renderPlatform(platform))}

            {this.canEditSettings && (
              <div>
                <a onClick={this.disableProtectedMode}>{$t('Stream to custom ingest')}</a>
              </div>
            )}
          </div>
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

  renderPlatform(platform: TPlatform) {
    const isMerged = this.streamingView.isPlatformLinked(platform);
    const username = this.userService.state.auth.platforms[platform]?.username;
    const platformName = getPlatformService(platform).displayName;
    const buttonClass = {
      facebook: 'button--facebook',
      mixer: 'button--mixer',
      youtube: 'button--youtube',
      twitch: 'button--twitch',
    }[platform];
    const isPrimary = this.streamingView.isPrimaryPlatform(platform);
    const shouldShowPrimaryBtn = isPrimary;
    const shouldShowConnectBtn = !isMerged;
    const shouldShowUnlinkBtn = !isPrimary && isMerged;

    // RIP Mixer
    if (platform === 'mixer' && !isPrimary) return;

    return (
      <div class="section flex">
        <div class="margin-right--20" style={{ width: '50px' }}>
          <PlatformLogo platform={platform} class={styles.platformLogo} />
        </div>
        <div>
          {platformName} <br />
          {isMerged ? username : <span style={{ opacity: '0.5' }}>{$t('unlinked')}</span>} <br />
        </div>

        <div style={{ marginLeft: 'auto' }}>
          {shouldShowConnectBtn && (
            <button
              onclick={() => this.platformMerge(platform)}
              class={cx(`button ${buttonClass}`, styles.platformButton)}
            >
              {$t('Connect')}
            </button>
          )}
          {shouldShowUnlinkBtn && (
            <button
              onclick={() => this.platformUnlink(platform)}
              class={cx('button button--soft-warning', styles.platformButton)}
            >
              {$t('Unlink')}
            </button>
          )}
          {shouldShowPrimaryBtn && (
            <span
              vTooltip={$t(
                'You cannot unlink the platform you used to sign in to Streamlabs OBS. If you want to unlink this platform, please sign in with a different platform.',
              )}
            >
              <button disabled={true} class={cx('button button--action', styles.platformButton)}>
                {$t('Logged in')}
              </button>
            </span>
          )}
        </div>
      </div>
    );
  }
}
