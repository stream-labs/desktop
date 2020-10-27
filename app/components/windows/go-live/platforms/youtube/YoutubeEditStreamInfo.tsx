import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { createProps } from 'components/tsx-component';
import { formMetadata, metadata } from 'components/shared/inputs';
import { $t } from 'services/i18n';
import BroadcastInput from './BroadcastInput';
import {
  IYoutubeCategory,
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
  isScheduleMode?: boolean = false;
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

  private get selectedBroadcast() {
    return this.broadcasts.find(
      broadcast => broadcast.id === this.settings.platforms.youtube.broadcastId,
    );
  }

  private fieldIsDisabled(fieldName: keyof IYoutubeStartStreamOptions): boolean {
    const selectedBroadcast = this.selectedBroadcast;
    if (!selectedBroadcast || selectedBroadcast.status.lifeCycleStatus !== 'live') return false;
    return !this.youtubeService.updatableSettings.includes(fieldName);
  }

  private async onSelectBroadcastHandler() {
    // set title and description fields from the selected broadcast
    const ytSettings = this.settings.platforms.youtube;
    const selectedBroadcast = this.selectedBroadcast;
    if (!selectedBroadcast) return;
    const { title, description } = selectedBroadcast.snippet;
    const { privacyStatus } = selectedBroadcast.status;
    const { enableDvr, projection, latencyPreference } = selectedBroadcast.contentDetails;
    ytSettings.title = title;
    ytSettings.description = description;
    ytSettings.enableDvr = enableDvr;
    ytSettings.latencyPreference = latencyPreference;
    ytSettings.projection = projection;
    ytSettings.privacyStatus = privacyStatus;

    // category id is a property of YoutubeVideo
    const video = await this.youtubeService.fetchVideo(selectedBroadcast.id);
    this.setCategory(video.snippet.categoryId);
  }

  private setCategory(categoryId: string) {
    this.settings.platforms.youtube.categoryId = categoryId;
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
      privacyStatus: metadata.list({
        title: $t('Privacy'),
        allowEmpty: false,
        options: [
          {
            value: 'public',
            title: $t('Public'),
            description: $t('Anyone can search for and view'),
          },
          {
            value: 'unlisted',
            title: $t('Unlisted'),
            description: $t('Anyone with the link can view'),
          },
          { value: 'private', title: $t('Private'), description: $t('Only you can view') },
        ],
        fullWidth: true,
      }),
      category: metadata.list({
        title: $t('Category'),
        allowEmpty: false,
        options: this.youtubeService.state.categories.map(category => ({
          value: category.id,
          title: category.snippet.title,
        })),
        fullWidth: true,
      }),
      latencyPreference: metadata.list<IYoutubeStartStreamOptions['latencyPreference']>({
        title: $t('Stream Latency'),
        options: [
          { value: 'normal', title: $t('Normal Latency') },
          { value: 'low', title: $t('Low-latency') },
          {
            value: 'ultraLow',
            title: $t('Ultra low-latency'),
            description: $t('Does not support: Closed captions, 1440p, and 4k resolutions'),
          },
        ],
        allowEmpty: false,
        tooltip: $t('latencyTooltip'),
        disabled: this.fieldIsDisabled('latencyPreference'),
      }),
      enableAutoStart: metadata.bool({
        title: 'Enable Auto-start',
        tooltip: $t(
          'Enabling auto-start will automatically start the stream when you start sending data from your streaming software',
        ),
        disabled: this.fieldIsDisabled('enableAutoStart'),
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
        disabled: this.fieldIsDisabled('projection'),
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
          {!this.props.isScheduleMode && (
            <HFormGroup title={$t('Event')}>
              <BroadcastInput
                onInput={this.onSelectBroadcastHandler}
                vModel={this.settings.platforms.youtube.broadcastId}
                metadata={this.formMetadata.event}
              />
            </HFormGroup>
          )}
          <CommonPlatformFields vModel={this.settings} platform={'youtube'} />
          <HFormGroup
            metadata={this.formMetadata.privacyStatus}
            vModel={this.settings.platforms.youtube.privacyStatus}
          />
          {!isUpdate && (
            <div>
              <HFormGroup
                metadata={this.formMetadata.category}
                vModel={this.settings.platforms.youtube.categoryId}
              />
              <HFormGroup
                metadata={this.formMetadata.latencyPreference}
                vModel={this.settings.platforms.youtube.latencyPreference}
              />
              <HFormGroup title={$t('Additional Settings')}>
                {!this.props.isScheduleMode && (
                  <FormInput
                    metadata={this.formMetadata.enableAutoStart}
                    vModel={this.settings.platforms.youtube.enableAutoStart}
                  />
                )}
                {!this.props.isScheduleMode && (
                  <FormInput
                    metadata={this.formMetadata.enableAutoStop}
                    vModel={this.settings.platforms.youtube.enableAutoStop}
                  />
                )}
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
