import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import TsxComponent, { createProps } from 'components/tsx-component';
import { formMetadata, metadata } from 'components/shared/inputs';
import { $t } from 'services/i18n';
import BroadcastInput from './BroadcastInput';
import {
  IYoutubeCategory,
  IYoutubeLiveBroadcast,
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
  private broadcasts: IYoutubeLiveBroadcast[] = [];
  private loaded = false;
  private categories: IYoutubeCategory[] = [];

  async created() {
    // load list of broadcasts and categories
    const [broadcasts, categories] = (await Promise.all([
      this.youtubeService.fetchBroadcasts(),
      this.youtubeService.fetchCategories(),
    ])) as [IYoutubeLiveBroadcast[], IYoutubeCategory[]];
    this.broadcasts = broadcasts;
    this.categories = categories;
    this.loaded = true;
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
        loading: !this.loaded,
        disabled: !this.canChangeBroadcast,
      },
      category: metadata.list({
        title: $t('Category'),
        allowEmpty: true,
        options: this.categories.map(category => ({
          value: category.id,
          title: category.snippet.title,
        })),
        loading: !this.loaded,
        fullWidth: true,
      }),
    });
  }

  render() {
    const canShowOnlyRequiredFields = this.canShowOnlyRequiredFields;
    return (
      !canShowOnlyRequiredFields && (
        <ValidatedForm>
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
          <HFormGroup
            metadata={this.formMetadata.category}
            vModel={this.settings.platforms.youtube.category}
          />
        </ValidatedForm>
      )
    );
  }
}
