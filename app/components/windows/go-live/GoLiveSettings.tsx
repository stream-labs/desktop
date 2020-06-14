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
import { IGoLiveSettings, StreamingService } from 'services/streaming';

import { Spinner, ProgressBar } from 'streamlabs-beaker';
import cloneDeep from 'lodash/cloneDeep';
import { StreamSettingsService } from '../../../services/settings/streaming';
import ValidatedForm from '../../shared/inputs/ValidatedForm';
import { IStreamError } from '../../../services/streaming/stream-error';
import GoLiveError from './GoLiveError';

/**
 * Renders the form with stream settings
 **/
@Component({})
export default class GoLiveWindow extends TsxComponent<{}> {
  settings: IGoLiveSettings = null;
  $refs: {
    settingsForm: ValidatedForm;
  };

  @Inject() private streamingService: StreamingService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private userService: UserService;

  private get view() {
    return this.streamingService.views;
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

  private getPlatformUsername(platform: TPlatform): string {
    return this.userService.state.auth.platforms[platform].username;
  }

  private switchPlatform(platform: TPlatform, enabled: boolean) {
    // save settings
    this.settings.destinations[platform].enabled = enabled;
    this.streamSettingsService.setGoLiveSettings(this.settings);

    // preload channel data
    this.streamingService.actions.prepopulateInfo();
  }

  private render() {
    // create a copy of a settings model if not exist
    if (!this.settings) this.settings = cloneDeep(this.streamingService.views.goLiveSettings);

    const platforms = this.view.availablePlatforms;
    const enabledPlatforms = this.view.enabledPlatforms;
    const hasPlatforms = enabledPlatforms.length > 0;
    const isErrorMode = this.view.info.error;
    const isLoadingMode =
      !isErrorMode && ['empty', 'prepopulate'].includes(this.view.info.lifecycle);
    const shouldShowSettings = !isErrorMode && !isLoadingMode && hasPlatforms;
    const isAdvancedMode = this.view.goLiveSettings.advancedMode;
    return (
      <ValidatedForm class="flex" ref="settingsForm">
        <div style={{ width: '400px', marginRight: '42px' }}>
          {platforms.map((platform: TPlatform) => this.renderPlatformSwitcher(platform))}
          {/*<div class={styles.rightText}>*/}
          {/*  <a href="#" class={styles.managePlatformsLink} onclick={this.showManagePlatforms}>*/}
          {/*    {$t('Manage Platforms')}*/}
          {/*  </a>*/}
          {/*</div>*/}
        </div>
        <div style={{ width: '100%' }}>
          {!hasPlatforms && $t('Enable at least one destination to start streaming')}

          {isLoadingMode && this.renderLoading()}
          <GoLiveError />

          {shouldShowSettings && (
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
              {isAdvancedMode && (
                <div>
                  {enabledPlatforms.map((platform: TPlatform) =>
                    this.renderSection(
                      this.renderPlatformSettings(platform),
                      this.getPlatformName(platform) + ' Settings',
                    ),
                  )}
                  {this.renderSection(
                    <div>
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
        </div>
      </ValidatedForm>
    );
  }

  private renderPlatformSwitcher(platform: TPlatform) {
    const platformSettings = this.settings.destinations[platform];
    const disabled = !platformSettings.enabled;
    return (
      <div
        class={cx(styles.platformSwitcher, { [styles.platformDisabled]: disabled })}
        onClick={() => this.switchPlatform(platform, !platformSettings.enabled)}
      >
        <div class={styles.colInput}>
          <ToggleInput value={platformSettings.enabled} />
        </div>
        <div class="logo margin-right--20">
          <PlatformLogo platform={platform} class={styles[`platform-logo-${platform}`]} />
        </div>
        <div class="account">
          <span class={styles.platformName}>Stream to {this.getPlatformName(platform)}</span> <br />
          {this.getPlatformUsername(platform)} <br />
        </div>
      </div>
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

  private renderGeneralForm() {
    const isAdvancedMode = this.view.goLiveSettings.advancedMode;
    const enabledPlatforms = this.view.enabledPlatforms;
    return this.renderSection(
      <div>
        <StreamTitleAndDescription vModel={this.settings.commonFields} />
        {!isAdvancedMode &&
          enabledPlatforms.map((platform: TPlatform) =>
            this.renderPlatformSettings(platform, true),
          )}
      </div>,
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
          goLiveSettings={this.settings}
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

  private renderLoading() {
    return <Spinner />;
  }
}
