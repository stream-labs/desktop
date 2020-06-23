import TsxComponent, { createProps } from 'components/tsx-component';
import { $t } from 'services/i18n';
import { Component, Watch, Prop } from 'vue-property-decorator';
import styles from './GoLive.m.less';
import { Inject } from 'services/core';
import { UserService } from 'services/user';
import { getPlatformService, TPlatform } from 'services/platforms';
import YoutubeEditStreamInfo from 'components/platforms/youtube/YoutubeEditStreamInfo';
import CommonPlatformFields from 'components/platforms/CommonPlatformFields';
import TwitchEditStreamInfo from '../../platforms/TwitchEditStreamInfo';
import FacebookEditStreamInfo from '../../platforms/FacebookEditStreamInfo';
import MixerEditStreamInfo from '../../platforms/MixerEditStreamInfo';
import { IGoLiveSettings, StreamingService } from 'services/streaming';

import { Spinner } from 'streamlabs-beaker';
import { StreamSettingsService } from '../../../services/settings/streaming';
import ValidatedForm from '../../shared/inputs/ValidatedForm';
import GoLiveError from './GoLiveError';
import { SyncWithValue } from '../../../services/app/app-decorators';
import { BoolInput } from '../../shared/inputs/inputs';

// TODO: dedup
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
          <div>{slot}</div>
        </div>
      );
    }

    // render content only in simple mode
    return <div>{slot}</div>;
  }
}

/**
 * Renders the form with stream settings for each enabled platform
 **/
@Component({})
// TODO: remove
export default class PlatformSettings extends TsxComponent<{ onInput?: any }> {
  @Inject() private streamingService: StreamingService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private userService: UserService;

  @SyncWithValue()
  private settings: IGoLiveSettings = null;

  private get view() {
    return this.streamingService.views;
  }

  private getPlatformName(platform: TPlatform): string {
    return getPlatformService(platform).displayName;
  }

  private render() {
    const enabledPlatforms = Object.keys(this.settings.destinations).filter(
      dest => this.settings.destinations[dest].enabled,
    ) as TPlatform[];

    // don't render platform settings if platform has not prepopulated the channel data
    if (!this.view.isPrepopulated(enabledPlatforms)) {
      return '';
    }
    const hasPlatforms = enabledPlatforms.length > 0;
    const isErrorMode = this.view.info.error;
    const isLoadingMode =
      !isErrorMode && ['empty', 'prepopulate'].includes(this.view.info.lifecycle);
    const shouldShowSettings = !isErrorMode && !isLoadingMode && hasPlatforms;
    const isMultiplePlatformMode = enabledPlatforms.length > 1;
    return (
      <ValidatedForm class="flex" ref="settingsForm">
        <div style={{ width: '100%' }}>
          {!hasPlatforms && $t('Enable at least one destination to start streaming')}

          {isLoadingMode && this.renderLoading()}
          <GoLiveError />

          {shouldShowSettings && (
            <div style={{ width: '100%' }}>
              {/*COMMON FIELDS*/}
              {isMultiplePlatformMode && (
                <CommonPlatformFields
                  vModel={this.settings.commonFields}
                  platforms={enabledPlatforms}
                />
              )}

              {/*SETTINGS FOR EACH ENABLED PLATFORM*/}
              {enabledPlatforms.map((platform: TPlatform) => this.renderPlatformSettings(platform))}
            </div>
          )}
        </div>
      </ValidatedForm>
    );
  }

  /**
   * Renders settings for one platform
   */
  private renderPlatformSettings(platform: TPlatform) {
    const isAdvancedMode = this.view.goLiveSettings.advancedMode && this.view.isMutliplatformMode;
    const title = $t('%{platform} Settings', { platform: this.getPlatformName(platform) });
    return (
      <Section title={title} isSimpleMode={!isAdvancedMode}>
        {platform === 'twitch' && (
          <TwitchEditStreamInfo
            vModel={this.settings.destinations.twitch}
            onInput={(val: boolean) => console.log('Platform change', val)}
          />
        )}

        {platform === 'facebook' && (
          <FacebookEditStreamInfo
            vModel={this.settings.destinations.facebook}
            goLiveSettings={this.settings}
          />
        )}

        {platform === 'youtube' && (
          <YoutubeEditStreamInfo vModel={this.settings.destinations.youtube} />
        )}

        {platform === 'mixer' && <MixerEditStreamInfo vModel={this.settings.destinations.mixer} />}
      </Section>
    );
  }

  private renderLoading() {
    return <Spinner />;
  }
}
