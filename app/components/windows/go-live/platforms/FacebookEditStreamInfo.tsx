import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { createProps } from 'components/tsx-component';
import CommonPlatformFields from '../CommonPlatformFields';
import { ListInput } from 'components/shared/inputs/inputs';
import { formMetadata, metadata } from 'components/shared/inputs';
import { $t } from 'services/i18n';
import { FacebookService, IFacebookLiveVideo } from 'services/platforms/facebook';
import { IStreamSettings, StreamingService } from '../../../../services/streaming';
import { SyncWithValue } from '../../../../services/app/app-decorators';
import BaseEditSteamInfo from './BaseEditSteamInfo';
import moment from 'moment';

class Props {
  value?: IStreamSettings = undefined;
}

/**
 * Edit Facebook stream settings
 */
@Component({ props: createProps(Props) })
export default class FacebookEditStreamInfo extends BaseEditSteamInfo<Props> {
  @Inject() private facebookService: FacebookService;
  @Inject() private streamingService: StreamingService;
  @SyncWithValue() settings: IStreamSettings;
  private scheduledVideos: IFacebookLiveVideo[] = [];
  private scheduledVideosLoaded = false;

  get view() {
    return this.streamingService.views;
  }

  async created() {
    this.scheduledVideos = await this.facebookService.fetchScheduledVideos();
    this.scheduledVideosLoaded = true;
  }

  private get formMetadata() {
    return formMetadata({
      page: metadata.list({
        title: $t('Facebook Page'),
        fullWidth: true,
        options: this.facebookService.state.facebookPages?.options || [],
        required: true,
      }),
      event: metadata.list({
        title: $t('Event'),
        fullWidth: true,
        options: [
          { value: null, title: $t('Create New Event') },
          ...this.scheduledVideos.map(vid => ({
            value: vid.id,
            title: `${vid.title} ${moment(new Date(vid.planned_start_time)).calendar()}`,
          })),
        ],
        required: false,
        loading: !this.scheduledVideosLoaded,
      }),
    });
  }

  render() {
    return (
      <ValidatedForm name="facebook-settings">
        <HFormGroup title={this.formMetadata.page.title}>
          <ListInput
            vModel={this.settings.platforms.facebook.facebookPageId}
            metadata={this.formMetadata.page}
          />
        </HFormGroup>

        {!this.canShowOnlyRequiredFields && (
          <div>
            <HFormGroup title={this.formMetadata.event.title}>
              <ListInput
                vModel={this.settings.platforms.facebook.scheduledVideoId}
                metadata={this.formMetadata.event}
              />
            </HFormGroup>
            <CommonPlatformFields vModel={this.settings} platform={'facebook'} />
          </div>
        )}
      </ValidatedForm>
    );
  }
}
