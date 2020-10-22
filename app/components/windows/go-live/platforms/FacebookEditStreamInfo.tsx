import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { createProps } from 'components/tsx-component';
import CommonPlatformFields from '../CommonPlatformFields';
import { ListInput } from 'components/shared/inputs/inputs';
import { formMetadata, metadata } from 'components/shared/inputs';
import { $t } from 'services/i18n';
import {
  FacebookService,
  IFacebookLiveVideo,
  IFacebookStartStreamOptions,
} from 'services/platforms/facebook';
import { IStreamSettings, StreamingService } from 'services/streaming';
import { SyncWithValue } from 'services/app/app-decorators';
import BaseEditSteamInfo from './BaseEditSteamInfo';
import moment from 'moment';

class Props {
  value?: IStreamSettings = undefined;
  /**
   * show the event selector?
   */
  isScheduleMode?: boolean = false;
  isUpdateMode?: boolean = false;
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

  /**
   * cached pictures for groups and pages
   */
  private pictures: Dictionary<string> = {};

  private get view() {
    return this.streamingService.views;
  }

  private get fbSettings(): IFacebookStartStreamOptions {
    return this.settings.platforms.facebook;
  }

  async created() {
    this.scheduledVideos = await this.facebookService.fetchScheduledVideos(this.fbSettings.pageId);
    this.scheduledVideosLoaded = true;
  }

  private async loadPicture(objectId: string): Promise<string> {
    if (this.pictures[objectId]) return this.pictures[objectId];
    this.$set(this.pictures, objectId, await this.facebookService.fetchPicture(objectId));
  }

  private async loadPictures(groupOrPage: IFacebookStartStreamOptions['destinationType']) {
    // setTimeout(() => {
    //   debugger;
    // }, 3000);
    const ids =
      groupOrPage === 'group'
        ? this.facebookService.state.facebookGroups.map(item => item.id)
        : this.facebookService.state.facebookPages.map(item => item.id);
    ids.forEach(id => this.loadPicture(id));
  }

  private get formMetadata() {
    return formMetadata({
      destinationType: metadata.list({
        title: $t('Facebook Destination'),
        fullWidth: true,
        options: [
          { value: 'me', title: $t('Share to Your Timeline') },
          { value: 'page', title: $t('Share to a Page You Manage') },
          { value: 'group', title: $t('Share in a Group') },
        ],
        required: true,
      }),

      page: metadata.list({
        title: $t('Facebook Page'),
        fullWidth: true,
        options:
          this.facebookService.state.facebookPages.map(page => ({
            value: page.id,
            title: `${page.name} | ${page.category}`,
            icon: this.pictures[page.id],
          })) || [],
        required: true,
      }),
      group: metadata.list({
        title: $t('Facebook Group'),
        fullWidth: true,
        options:
          this.facebookService.state.facebookGroups.map(group => ({
            value: group.id,
            title: group.name,
            icon: this.pictures[group.id],
          })) || [],
        required: true,
      }),
      event: metadata.list({
        title: $t('Scheduled Video'),
        fullWidth: true,
        options: [
          { value: null, title: $t('Not selected') },
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

  private onSelectScheduledVideoHandler() {
    // set title and description fields from selected video
    const fbSettings = this.settings.platforms.facebook;
    const selectedLiveVideo = this.scheduledVideos.find(
      video => video.id === fbSettings.liveVideoId,
    );
    if (!selectedLiveVideo) return;
    const { title, description } = selectedLiveVideo;
    fbSettings.title = title;
    fbSettings.description = description;
  }

  render() {
    const fbSettings = this.settings.platforms.facebook;
    const shouldShowGroups = fbSettings.destinationType === 'group' && !this.props.isUpdateMode;
    const shouldShowPages = fbSettings.destinationType === 'page' && !this.props.isUpdateMode;

    return (
      <ValidatedForm name="facebook-settings">
        {!this.props.isUpdateMode && (
          <HFormGroup title={this.formMetadata.destinationType.title}>
            <ListInput
              vModel={this.settings.platforms.facebook.destinationType}
              metadata={this.formMetadata.destinationType}
            />
          </HFormGroup>
        )}

        {shouldShowPages && (
          <HFormGroup title={this.formMetadata.page.title}>
            <ListInput
              vModel={fbSettings.pageId}
              metadata={this.formMetadata.page}
              handleOpen={() => this.loadPictures('page')}
            />
          </HFormGroup>
        )}

        {shouldShowGroups && (
          <HFormGroup title={this.formMetadata.group.title}>
            <ListInput
              vModel={fbSettings.groupId}
              metadata={this.formMetadata.group}
              handleOpen={() => this.loadPictures('group')}
            />
          </HFormGroup>
        )}

        {!this.canShowOnlyRequiredFields && (
          <div>
            {!this.props.isUpdateMode && !this.props.isScheduleMode && (
              <HFormGroup title={this.formMetadata.event.title}>
                <ListInput
                  vModel={this.settings.platforms.facebook.liveVideoId}
                  metadata={this.formMetadata.event}
                  onInput={() => this.onSelectScheduledVideoHandler()}
                />
              </HFormGroup>
            )}

            <CommonPlatformFields vModel={this.settings} platform={'facebook'} />
          </div>
        )}
      </ValidatedForm>
    );
  }
}
