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
  broadcasts: IYoutubeLiveBroadcast[] = [];
  broadcastsLoaded = false;

  async created() {
    this.broadcasts = await this.youtubeService.fetchBroadcasts();
    this.broadcastsLoaded = true;
  }

  get canChangeBroadcast() {
    return !this.view.isMidStreamMode;
  }

  get view() {
    return this.streamingService.views;
  }

  onSelectBroadcastHandler() {
    // set title and description fields from selected broadcast
    const ytSettings = this.settings.platforms.youtube;
    const selectedBroadcast = this.broadcasts.find(
      broadcast => broadcast.id === ytSettings.broadcastId,
    );
    if (!selectedBroadcast) return;
    const { title, description } = selectedBroadcast.snippet;
    ytSettings.title = title;
    ytSettings.description = description;
  }

  get formMetadata() {
    return formMetadata({
      event: {
        broadcasts: this.broadcasts,
        loading: !this.broadcastsLoaded,
        disabled: !this.canChangeBroadcast,
      },
    });
  }

  render() {
    const canShowOnlyRequiredFields = this.canShowOnlyRequiredFields;
    return (
      !canShowOnlyRequiredFields && (
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
        </ValidatedForm>
      )
    );
  }
}
