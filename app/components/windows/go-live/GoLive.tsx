import TsxComponent from 'components/tsx-component';
import ModalLayout from 'components/ModalLayout.vue';
import { $t } from 'services/i18n';
import { Component } from 'vue-property-decorator';
import PlatformLogo from 'components/shared/PlatformLogo';
import styles from './GoLive.m.less';
import { Inject } from 'services/core';
import { UserService } from 'services/user';
import { getPlatformService, TPlatform } from 'services/platforms';
import { BoolInput, ToggleInput } from 'components/shared/inputs/inputs';
import cx from 'classnames';
import { formMetadata, IListOption, metadata } from 'components/shared/inputs';
import { SettingsService } from 'services/settings';
import YoutubeEditStreamInfo from 'components/platforms/youtube/YoutubeEditStreamInfo';
import StreamTitleAndDescription from 'components/platforms/StreamTitleAndDescription';
import TwitchEditStreamInfo from '../../platforms/TwitchEditStreamInfo';
import FacebookEditStreamInfo from '../../platforms/FacebookEditStreamInfo';
import MixerEditStreamInfo from '../../platforms/MixerEditStreamInfo';
import HFormGroup from '../../shared/inputs/HFormGroup.vue';
import { Twitter } from '../../Twitter';
import { IEncoderProfile } from 'services/video-encoding-optimizations';
import { WindowsService } from 'services/windows';
import { StreamInfoService } from 'services/stream-info';

interface IPlatformStreamSettings {
  enabled: boolean;
  useCustomTitleAndDescription: boolean;
  values: Dictionary<unknown>;
}

@Component({})
export default class GoLiveWindow extends TsxComponent<{}> {
  @Inject() private userService: UserService;
  @Inject() private settingsService: SettingsService;
  @Inject() private streamInfoService: StreamInfoService;

  private get userName() {
    return this.userService.username;
  }

  private useOptimizedProfile = true;

  private platforms: { [key in TPlatform]: IPlatformStreamSettings } = null;

  private streamInfo = {
    title: '',
    description: '',
  };

  private components = {
    youtube: YoutubeEditStreamInfo,
    twitch: TwitchEditStreamInfo,
    facebook: FacebookEditStreamInfo,
    mixer: MixerEditStreamInfo,
  };

  private get isAdvancedMode() {
    return this.streamInfoService.state.advancedMode;
  }

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

  created() {
    const platformTypes: TPlatform[] = ['facebook', 'mixer', 'twitch', 'youtube'];
    const platformSettings: Dictionary<IPlatformStreamSettings> = {};
    platformTypes.forEach(platformType => {
      const service = getPlatformService(platformType);
      const fields = service.getStreamFields();
      const values = {};
      Object.keys(fields).forEach(fieldName => {
        values[fieldName] = '';
      });

      platformSettings[platformType] = {
        enabled: true,
        useCustomTitleAndDescription: false,
        values,
      };
    });
    this.platforms = platformSettings as { [key in TPlatform]: IPlatformStreamSettings };
  }

  private get enabledPlatforms(): TPlatform[] {
    return Object.keys(this.platforms).filter(
      platform => this.platforms[platform].enabled,
    ) as TPlatform[];
  }

  selectedProfile: IEncoderProfile = null;

  get optimizedProfileMetadata() {
    const gamName = 'Unknown';
    const game = 'gameName'; // this.selectedProfile.game !== 'DEFAULT' ? `for ${gamName}` : '';
    return {
      title: $t('Use optimized encoder settings ') + game,
      tooltip: $t(
        'Optimized encoding provides better quality and/or lower cpu/gpu usage. Depending on the game, ' +
          'resolution may be changed for a better quality of experience',
      ),
    };
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private showManagePlatforms() {
    this.settingsService.showSettings('Stream');
  }

  private switchAdvancedMode(enabled: boolean) {
    this.streamInfoService.updateInfo({ advancedMode: enabled });
    this.streamInfoService.showEditStreamInfo();
  }

  render() {
    const hasPlatforms = this.enabledPlatforms.length > 0;
    return (
      <ModalLayout customControls={true} showControls={false}>
        <div slot="content" class="flex">
          <div style={{ width: '400px', marginRight: '42px' }}>
            {Object.keys(this.platforms).map((platform: TPlatform) =>
              this.renderPlatformSwitcher(platform),
            )}
            {/*<div class={styles.rightText}>*/}
            {/*  <a href="#" class={styles.managePlatformsLink} onclick={this.showManagePlatforms}>*/}
            {/*    {$t('Manage Platforms')}*/}
            {/*  </a>*/}
            {/*</div>*/}
          </div>
          {!hasPlatforms && (
            <div style={{ width: '100%' }}> Enable at least one destination to start streaming</div>
          )}

          {hasPlatforms && (
            <div style={{ width: '100%' }}>
              {this.renderGeneralForm()}
              {/*{!this.isAdvancedMode && (*/}
              {/*  <div class={styles.rightText}>*/}
              {/*    {$t('Looking for more options?')}*/}
              {/*    &nbsp;*/}
              {/*    <a class={styles.managePlatformsLink} onClick={() => this.switchAdvancedMode(true)}>*/}
              {/*      {$t('Switch Advanced Mode ON')}*/}
              {/*    </a>*/}
              {/*  </div>*/}
              {/*)}*/}
              {this.isAdvancedMode && (
                <div>
                  {this.enabledPlatforms.map((platform: TPlatform) =>
                    this.renderSection(
                      this.renderPlatformSettings(platform),
                      this.capitalize(platform) + ' Settings',
                    ),
                  )}
                  {this.renderSection(
                    <div>
                      <Twitter streamTitle="" midStreamMode={false} value="" updatingInfo={false} />

                      <div>
                        <HFormGroup
                          metadata={{
                            tooltip: $t(
                              'Optimized encoding provides better quality and/or lower cpu/gpu usage. Depending on the game, resolution may be changed for a better quality of experience',
                            ),
                          }}
                        >
                          <BoolInput
                            vModel={this.useOptimizedProfile}
                            metadata={this.optimizedProfileMetadata}
                          />
                        </HFormGroup>
                      </div>
                    </div>,
                    $t('Extras'),
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          slot="controls"
          class="controls"
          style={{ display: 'flex', 'flex-direction': 'row-reverse' }}
        >
          <button class={cx('button button--action', styles.goLiveButton)}>
            {$t('Confirm and Go Live')}
          </button>
          <button class="button button--default">{$t('Cancel')}</button>
          <div class={styles.modeToggle}>
            <HFormGroup
              onInput={(val: boolean) => this.switchAdvancedMode(val)}
              value={this.isAdvancedMode}
              metadata={metadata.toggle({ title: $t('Advanced Mode') })}
            />
          </div>
        </div>
      </ModalLayout>
    );
  }

  private renderPlatformSwitcher(platform: TPlatform) {
    const disabled = !this.platforms[platform].enabled;
    return (
      <div
        class={cx(styles.platformSwitcher, { [styles.platformDisabled]: disabled })}
        onClick={() => (this.platforms[platform].enabled = !this.platforms[platform].enabled)}
      >
        <div class={styles.colInput}>
          <ToggleInput value={this.platforms[platform].enabled} />
        </div>
        <div class="logo margin-right--20">
          <PlatformLogo platform={platform} class={styles[`platform-logo-${platform}`]} />
        </div>
        <div class="account">
          <span class={styles.platformName}>Stream to {this.capitalize(platform)}</span> <br />
          {this.userName} <br />
        </div>
      </div>
    );
  }

  private renderGeneralForm() {
    return this.renderSection(
      <div>
        <StreamTitleAndDescription vModel={this.streamInfo} />
        {!this.isAdvancedMode &&
          this.enabledPlatforms.map((platform: TPlatform) =>
            this.renderPlatformSettings(platform, true),
          )}
      </div>,
    );
  }

  private renderSection(el: JSX.Element, title?: string) {
    return (
      <div class={styles.section}>
        {title && <h2>{title}</h2>}
        <div>{el}</div>
      </div>
    );
  }

  private renderPlatformSettings(platform: TPlatform, showOnlyRequiredFields = false) {
    const SettingsComponent = this.components[platform];

    return (
      <div>
        <SettingsComponent
          value={{ description: '', title: '', broadcastId: '' }}
          canChangeBroadcast={true}
          showOnlyRequiredFields={showOnlyRequiredFields}
        />
      </div>
    );
  }
}
