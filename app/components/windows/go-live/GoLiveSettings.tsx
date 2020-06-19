import TsxComponent, { createProps } from 'components/tsx-component';
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
import CommonPlatformFields from 'components/platforms/CommonPlatformFields';
import TwitchEditStreamInfo from '../../platforms/TwitchEditStreamInfo';
import FacebookEditStreamInfo from '../../platforms/FacebookEditStreamInfo';
import MixerEditStreamInfo from '../../platforms/MixerEditStreamInfo';
import HFormGroup from '../../shared/inputs/HFormGroup.vue';
import { IGoLiveSettings, StreamingService } from 'services/streaming';

import { Spinner, ProgressBar } from 'streamlabs-beaker';
import cloneDeep from 'lodash/cloneDeep';
import { StreamSettingsService } from '../../../services/settings/streaming';
import ValidatedForm from '../../shared/inputs/ValidatedForm';
import PlatformSettings from './PlatformSettings';
import { IStreamError } from '../../../services/streaming/stream-error';
import GoLiveError from './GoLiveError';
import { GoLiveProps } from './goLiveProps';
import { SyncWithValue } from '../../../services/app/app-decorators';
import { OptimizedProfileSwitcher } from './OptimizedProfileSwitcher';

class SectionProps {
  title?: string = '';
  isSimpleMode?: boolean = false;
}

/**
 * renders a section wrapper
 */
@Component({ props: createProps(SectionProps) })
class Section extends TsxComponent<SectionProps> {
  private render() {
    const slot = this.$slots.default;
    const title = this.props.title;

    // render heading and section wrapper in advanced mode
    if (!this.props.isSimpleMode) {
      return (
        <div class={styles.section}>
          {title && <h2>{title}</h2>}
          {!title && <div class={styles.spacer} />}
          <div>{slot}</div>
        </div>
      );
    }

    // render content only in simple mode
    return <div>{slot}</div>;
  }
}

/**
 * Renders settings for starting the stream
 * - Platform switchers
 * - Settings for each platform
 * - Extras settings
 **/
@Component({ props: createProps(GoLiveProps) })
export default class GoLiveSettings extends TsxComponent<GoLiveProps> {
  @Inject() private streamingService: StreamingService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private settingsService: SettingsService;
  @Inject() private userService: UserService;

  @SyncWithValue()
  private settings: IGoLiveSettings = null;

  private get view() {
    return this.streamingService.views;
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

  private addDestination() {
    this.settingsService.actions.showSettings('Stream');
  }

  private render() {
    const view = this.view;
    const platforms = view.availablePlatforms;
    const enabledPlatforms = view.enabledPlatforms;
    const hasPlatforms = enabledPlatforms.length > 0;
    const isErrorMode = view.info.error;
    const isLoadingMode = !isErrorMode && ['empty', 'prepopulate'].includes(view.info.lifecycle);
    const shouldShowSettings = !isErrorMode && !isLoadingMode && hasPlatforms;
    const isAdvancedMode = view.goLiveSettings.advancedMode && view.isMutliplatformMode;
    const shouldShowAddDestination = view.allPlatforms.length !== view.availablePlatforms.length;
    return (
      <ValidatedForm class="flex">
        {/*PLATFORMS SWITCHERS*/}
        <div style={{ width: '400px', marginRight: '42px' }}>
          {platforms.map((platform: TPlatform) => this.renderPlatformSwitcher(platform))}

          {/*ADD DESTINATION BUTTON*/}
          {shouldShowAddDestination && (
            <a class={styles.addDestinationBtn} onclick={this.addDestination}>
              <i class="fa fa-plus" />
              {$t('Add Destination')}
            </a>
          )}
        </div>
        <div style={{ width: '100%' }}>
          {!hasPlatforms && $t('Enable at least one destination to start streaming')}

          {isLoadingMode && this.renderLoading()}
          <GoLiveError />

          {shouldShowSettings && (
            <div class={styles.settingsContainer}>
              {/*PLATFORM SETTINGS*/}
              <PlatformSettings vModel={this.settings} />

              {/*ADD SOME SPACE*/}
              {!isAdvancedMode && <div class={styles.spacer} />}

              {/*EXTRAS*/}
              <Section title={isAdvancedMode ? $t('Extras') : ''}>
                <OptimizedProfileSwitcher
                  vModel={this.settings.optimizedProfile}
                  settings={this.settings}
                />
              </Section>
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

  private renderLoading() {
    return <Spinner />;
  }
}
