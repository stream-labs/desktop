import TsxComponent from 'components/tsx-component';
import ModalLayout from 'components/ModalLayout.vue';
import { $t } from 'services/i18n';
import { Component, Watch } from 'vue-property-decorator';
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
import { StreamInfoDeprecatedService } from 'services/stream-info-deprecated';
import { YoutubeService } from '../../../services/platforms/youtube';
import {
  IGoLiveSettings,
  IPlatformStreamSettings,
  IStreamInfo,
  StreamingService,
} from 'services/streaming';

import { Spinner, ProgressBar } from 'streamlabs-beaker';
import cloneDeep from 'lodash/cloneDeep';
import { StreamSettingsService } from '../../../services/settings/streaming';
import ValidatedForm from '../../shared/inputs/ValidatedForm';
import GoLiveChecklist from './GoLiveChecklist';

@Component({})
export default class GoLiveWindow extends TsxComponent<{}> {
  @Inject() private userService: UserService;
  @Inject() private settingsService: SettingsService;
  @Inject() private streamingService: StreamingService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private windowsService: WindowsService;
  @Inject('StreamInfoDeprecatedService') private streamInfoService: StreamInfoDeprecatedService;

  $refs: {
    settingsForm: ValidatedForm;
  };

  private get userName() {
    return this.userService.username;
  }

  private settings: IGoLiveSettings = null;

  private get platforms() {
    return this.settings.destinations;
  }

  private components = {
    youtube: YoutubeEditStreamInfo,
    twitch: TwitchEditStreamInfo,
    facebook: FacebookEditStreamInfo,
    mixer: MixerEditStreamInfo,
  };

  private get state() {
    return this.streamingService.views;
  }

  private get isAdvancedMode() {
    return this.state.goLiveSettings.advancedMode;
  }

  private get lifecycleStep() {
    return this.state.info.lifecycle;
  }

  @Watch('lifecycleStep')
  private onLifecycleStepChangeHandler(step: IStreamInfo['lifecycle']) {
    // close the window when we're live
    // if (this.lifecycleStep === 'live') this.windowsService.actions.closeChildWindow();
  }

  @Watch('settings', { deep: true, immediate: true })
  private onSettingsChange() {
    console.log('settings changed', this.settings);
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

  async created() {
    // fetch platforms' data
    this.streamingService.actions.prepopulateInfo();
  }

  private get enabledPlatforms(): TPlatform[] {
    return Object.keys(this.platforms).filter(
      platform => this.platforms[platform].enabled,
    ) as TPlatform[];
  }

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

  private getPlatformName(platform: TPlatform): string {
    return getPlatformService(platform).displayName;
  }

  private showManagePlatforms() {
    this.settingsService.showSettings('Stream');
  }

  private switchAdvancedMode(enabled: boolean) {
    this.streamSettingsService.setGoLiveSettings({ advancedMode: enabled });
    this.streamInfoService.showEditStreamInfo();
  }

  private async goLive(force = false) {
    const errors = await this.$refs.settingsForm.validateAndGetErrorsCount();
    if (errors) return;
    this.streamingService.actions.goLive(this.settings);

    // try {
    //   this.updatingInfo = true;
    //   await this.streamingService.toggleStreaming(this.channelInfo, force);
    //   this.streamInfoService.createGameAssociation(this.channelInfo.game);
    //   this.windowsService.closeChildWindow();
    //   // youtube needs additional actions after the stream has been started
    //   if (
    //     (this.windowQuery.platforms && this.windowQuery.platforms.includes('youtube')) ||
    //     this.isYoutube
    //   ) {
    //     (getPlatformService('youtube') as YoutubeService).showStreamStatusWindow();
    //   }
    // } catch (e) {
    //   const message = this.platformService.getErrorDescription(e);
    //   this.$toasted.show(message, {
    //     position: 'bottom-center',
    //     className: 'toast-alert',
    //     duration: 1000,
    //     singleton: true,
    //   });
    //   this.infoError = true;
    //   this.updatingInfo = false;
    // }
  }

  private close() {
    this.windowsService.closeChildWindow();
  }

  /**
   * Renders the main component template
   **/
  render() {
    const isIdleMode = this.state.info.lifecycle === 'idle';
    const isLoadingMode = this.state.info.lifecycle === 'channelPrefetch';
    const isChecklistMode = !isIdleMode && !isLoadingMode;
    return (
      <ModalLayout customControls={true} showControls={false}>
        <div slot="content">
          {isLoadingMode && this.renderLoading()}
          {isIdleMode && this.renderSettings()}
          {isChecklistMode && <GoLiveChecklist />}
        </div>
        <div slot="controls">{this.renderControls()}</div>
      </ModalLayout>
    );
  }

  private renderLoading() {
    return <Spinner />;
  }

  private renderErrors() {
    return <div>Errors are found</div>;
  }

  /**
   * Renders the form with stream settings
   **/
  private renderSettings() {
    // create a copy of a settings model if not exist
    if (!this.settings) this.settings = cloneDeep(this.streamingService.views.goLiveSettings);

    const hasPlatforms = this.enabledPlatforms.length > 0;
    return (
      <ValidatedForm class="flex" ref="settingsForm">
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
                    this.getPlatformName(platform) + ' Settings',
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
                          vModel={this.settings.useOptimizedProfile}
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
        )
      </ValidatedForm>
    );
  }

  private renderControls() {
    const isIdle = this.state.info.lifecycle === 'idle';
    return (
      <div class="controls" style={{ display: 'flex', 'flex-direction': 'row-reverse' }}>
        {/* GO LIVE BUTTON */}
        {isIdle && (
          <button
            class={cx('button button--action', styles.goLiveButton)}
            onClick={() => this.goLive()}
          >
            {$t('Confirm and Go Live')}
          </button>
        )}

        {/* CLOSE BUTTON */}
        <button
          onClick={() => this.close()}
          class={cx('button button--default', styles.cancelButton)}
        >
          {$t('Close')}
        </button>

        {/* ADVANCED MODE SWITCHER */}
        {isIdle && (
          <div class={styles.modeToggle}>
            <HFormGroup
              onInput={(val: boolean) => this.switchAdvancedMode(val)}
              value={this.isAdvancedMode}
              metadata={metadata.toggle({ title: $t('Advanced Mode') })}
            />
          </div>
        )}
      </div>
    );
  }

  private renderPrepopulateInfo() {
    return <div></div>;
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
          <span class={styles.platformName}>Stream to {this.getPlatformName(platform)}</span> <br />
          {this.userName} <br />
        </div>
      </div>
    );
  }

  private renderGeneralForm() {
    return this.renderSection(
      <div>
        <StreamTitleAndDescription vModel={this.settings.commonFields} />
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
    if (platform === 'twitch') {
      return (
        <TwitchEditStreamInfo
          vModel={this.settings.destinations.twitch}
          showOnlyRequiredFields={showOnlyRequiredFields}
        />
      );
    }

    if (platform === 'facebook') {
      return (
        <FacebookEditStreamInfo
          vModel={this.settings.destinations.facebook}
          showOnlyRequiredFields={showOnlyRequiredFields}
        />
      );
    }

    if (platform === 'youtube') {
      return (
        <YoutubeEditStreamInfo
          vModel={this.settings.destinations.youtube}
          showOnlyRequiredFields={showOnlyRequiredFields}
          canChangeBroadcast={true}
        />
      );
    }

    if (platform === 'mixer') {
      return (
        <MixerEditStreamInfo
          vModel={this.settings.destinations.mixer}
          showOnlyRequiredFields={showOnlyRequiredFields}
        />
      );
    }
  }
}
