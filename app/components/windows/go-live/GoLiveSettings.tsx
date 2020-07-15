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
import { IGoLiveSettings, StreamingService } from 'services/streaming';

import { Spinner, ProgressBar } from 'streamlabs-beaker';
import cloneDeep from 'lodash/cloneDeep';
import { StreamSettingsService } from '../../../services/settings/streaming';
import ValidatedForm from '../../shared/inputs/ValidatedForm';
import PlatformSettings from './PlatformSettings';
import { IStreamError } from '../../../services/streaming/stream-error';
import GoLiveError from './GoLiveError';
import { SyncWithValue } from '../../../services/app/app-decorators';
import { OptimizedProfileSwitcher } from './OptimizedProfileSwitcher';
import { DestinationSwitchers } from './DestinationSwitchers';
import { Twitter } from '../../Twitter';
import { RestreamService } from '../../../services/restream';

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

class GoLiveProps {
  value?: IGoLiveSettings = null;
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
  @Inject() private restreamService: RestreamService;

  @SyncWithValue()
  private settings: IGoLiveSettings = null;

  private get view() {
    return this.streamingService.views;
  }

  private switchPlatform(platform: TPlatform, enabled: boolean) {
    console.log('handle on switch');
    // save settings
    this.settings.destinations[platform].enabled = enabled;
    this.streamSettingsService.setGoLiveSettings(this.settings);

    // preload channel data
    this.streamingService.actions.prepopulateInfo();
  }

  private addDestination() {
    if (this.restreamService.canEnableRestream) {
      this.settingsService.actions.showSettings('Stream');
    } else {
      this.userService.openPrimeUrl('slobsmultistream');
    }
  }

  private render() {
    const view = this.view;
    const enabledPlatforms = view.enabledPlatforms;
    const hasPlatforms = enabledPlatforms.length > 0;
    const isErrorMode = view.info.error;
    const isLoadingMode = !isErrorMode && ['empty', 'prepopulate'].includes(view.info.lifecycle);
    const shouldShowSettings = !isErrorMode && !isLoadingMode && hasPlatforms;
    const isAdvancedMode = view.goLiveSettings.advancedMode && view.isMutliplatformMode;
    const shouldShowAddDestination = view.allPlatforms.length !== view.linkedPlatforms.length;
    return (
      <ValidatedForm class="flex">
        {/*LEFT COLUMN*/}
        <div style={{ width: '400px', marginRight: '42px' }}>
          {/*DESTINATION SWITCHERS*/}
          <DestinationSwitchers
            value={this.settings.destinations}
            title="Stream to %{platformName}"
            canDisablePrimary={false}
            handleOnSwitch={(...args) => this.switchPlatform(...args)}
          />
          {/*ADD DESTINATION BUTTON*/}
          {shouldShowAddDestination && (
            <a class={styles.addDestinationBtn} onclick={this.addDestination}>
              <i class="fa fa-plus" />
              {$t('Add Destination')} <b class={styles.prime}>prime</b>
            </a>
          )}
        </div>

        {/*RIGHT COLUMN*/}
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
                <Twitter
                  vModel={this.settings.tweetText}
                  streamTitle={this.view.getCommonFields(this.settings).title}
                />
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

  private renderLoading() {
    return <Spinner />;
  }
}
