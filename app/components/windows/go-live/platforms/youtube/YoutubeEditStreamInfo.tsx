import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { cloneDeep } from 'lodash';
import TsxComponent, { createProps } from 'components/tsx-component';
import { formMetadata, metadata } from 'components/shared/inputs';
import { $t } from 'services/i18n';
import BroadcastInput from './BroadcastInput';
import {
  IYoutubeLiveBroadcast,
  IYoutubeStartStreamOptions,
  YoutubeService,
} from 'services/platforms/youtube';
import CommonPlatformFields from '../../CommonPlatformFields';
import { StreamingService, IStreamSettings } from 'services/streaming';
import { SyncWithValue } from 'services/app/app-decorators';
import BaseEditStreamInfo from '../BaseEditSteamInfo';
import FormInput from 'components/shared/inputs/FormInput.vue';

class Props {
  value?: IStreamSettings;

  /**
   * show the event selector?
   */
  showEvents?: boolean = true;
}

/**
 * Edit Youtube stream settings
 */
@Component({ components: { ValidatedForm }, props: createProps(Props) })
export default class YoutubeEditStreamInfo extends BaseEditStreamInfo<Props> {
  @Inject() private youtubeService: YoutubeService;
  @Inject() private streamingService: StreamingService;
  @SyncWithValue() protected settings: IStreamSettings;
  private broadcasts: IYoutubeLiveBroadcast[] = [];
  private broadcastsLoaded = false;

  async created() {
    this.broadcasts = await this.youtubeService.fetchBroadcasts();
    this.broadcastsLoaded = true;
  }

  private get canChangeBroadcast() {
    return !this.view.isMidStreamMode;
  }

  private get view() {
    return this.streamingService.views;
  }

  private onSelectBroadcastHandler() {
    // set title and description fields from selected broadcast
    const ytSettings = this.settings.platforms.youtube;
    const selectedBroadcast = this.broadcasts.find(
      broadcast => broadcast.id === ytSettings.broadcastId,
    );
    if (!selectedBroadcast) return;
    const { title, description } = selectedBroadcast.snippet;
    ytSettings.title = title;
    ytSettings.description = description;
    ytSettings.enableAutoStart = selectedBroadcast.contentDetails.enableAutoStart;
  }

  private onProjectionChangeHandler(enable360: boolean) {
    this.settings.platforms.youtube.projection = enable360 ? '360' : 'rectangular';
  }

  private get formMetadata() {
    return formMetadata({
      event: {
        broadcasts: this.broadcasts,
        loading: !this.broadcastsLoaded,
        disabled: !this.canChangeBroadcast,
      },
      latencyPreference: metadata.list<IYoutubeStartStreamOptions['latencyPreference']>({
        title: $t('Stream Latency'),
        options: [
          { value: 'normal', title: $t('Normal Latency') },
          { value: 'low', title: $t('Low-latency') },
          {
            value: 'ultra-low',
            title: $t('Ultra low-latency'),
            description: $t('Does not support: Closed captions, 1440p, and 4k resolutions'),
          },
        ],
        allowEmpty: false,
        tooltip: $t(
          'A low-latency stream can reduce the amount of time it takes for video to be visible to users watching a broadcast, though it can also affect the smoothness of playback.\n' +
            '\n' +
            'An ultra-low-latency stream further reduces the time it takes for video to be visible to viewers, making interaction with viewers easier, but ultra-low latency does not support closed captions, or resolutions higher than 1080p.',
        ),
      }),
      enableAutoStart: metadata.bool({
        title: 'Enable Auto-start',
        tooltip: $t(
          'Enabling auto-start will automatically start the stream when you start sending data from your streaming software',
        ),
      }),
      enableAutoStop: metadata.bool({
        title: 'Enable Auto-stop',
        tooltip: $t(
          'Enabling auto-stop will automatically stop the stream when you stop sending data from your streaming software',
        ),
      }),
      enableDvr: metadata.bool({
        title: $t('Enable DVR'),
        tooltip: $t(
          'DVR controls enable the viewer to control the video playback experience by pausing, rewinding, or fast forwarding content',
        ),
      }),
      projection: metadata.bool({
        title: $t('360° video'),
      }),
    });
  }

  render() {
    const ytSettings = this.settings.platforms.youtube;
    const shouldShowOptionalFields = !this.canShowOnlyRequiredFields;
    const isUpdate = this.view.isMidStreamMode;
    const is360video = ytSettings.projection === '360';
    return (
      shouldShowOptionalFields && (
        <ValidatedForm name="youtube-settings">
          {this.props.showEvents && (
            <HFormGroup title={$t('Event')}>
              <BroadcastInput
                onInput={this.onSelectBroadcastHandler}
                vModel={this.settings.platforms.youtube.broadcastId}
                metadata={this.formMetadata.event}
              />
            </HFormGroup>
          )}
          <CommonPlatformFields vModel={this.settings} platform={'youtube'} />
          {!isUpdate && (
            <div>
              <HFormGroup
                metadata={this.formMetadata.latencyPreference}
                vModel={this.settings.platforms.youtube.latencyPreference}
              />
              <HFormGroup title={$t('Additional Settings')}>
                <FormInput
                  metadata={this.formMetadata.enableAutoStart}
                  vModel={this.settings.platforms.youtube.enableAutoStart}
                />
                <FormInput
                  metadata={this.formMetadata.enableAutoStop}
                  vModel={this.settings.platforms.youtube.enableAutoStop}
                />
                <FormInput
                  metadata={this.formMetadata.enableDvr}
                  vModel={this.settings.platforms.youtube.enableDvr}
                />
                <FormInput
                  metadata={this.formMetadata.projection}
                  value={is360video}
                  onInput={(val: boolean) => this.onProjectionChangeHandler(val)}
                />
              </HFormGroup>
            </div>
          )}
        </ValidatedForm>
      )
    );
  }
}
