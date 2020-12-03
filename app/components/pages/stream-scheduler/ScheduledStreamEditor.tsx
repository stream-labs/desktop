import TsxComponent, { createProps, required } from 'components/tsx-component';
import ModalLayout from 'components/ModalLayout.vue';
import { $t } from 'services/i18n';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core';
import { UserService } from 'services/user';
import { formMetadata, metadata } from 'components/shared/inputs';
import { SettingsService } from 'services/settings';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { WindowsService } from 'services/windows';
import { IStreamSettings, StreamingService } from 'services/streaming';
import { Spinner } from 'streamlabs-beaker';
import cloneDeep from 'lodash/cloneDeep';
import { StreamSettingsService } from 'services/settings/streaming';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import PlatformSettings from 'components/windows/go-live/PlatformSettings';
import { TPlatform } from 'services/platforms';
import moment from 'moment';
import { ToggleInput } from '../../shared/inputs/inputs';
import cx from 'classnames';
import { IYoutubeLiveBroadcast, YoutubeService } from 'services/platforms/youtube';
import { FacebookService, IFacebookLiveVideo } from 'services/platforms/facebook';
import styles from './ScheduledStreamEditor.m.less';

class Props {
  id?: string = '';
  date: number = 0;
  platform?: TPlatform | '' = '';
}

@Component({ props: createProps(Props) })
export default class ScheduledStreamEditor extends TsxComponent<Props> {
  @Inject() private userService: UserService;
  @Inject() private settingsService: SettingsService;
  @Inject() private streamingService: StreamingService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private windowsService: WindowsService;
  @Inject() private youtubeService: YoutubeService;
  @Inject() private facebookService: FacebookService;

  $refs: {
    form: ValidatedForm;
  };

  private selectedPlatform: TPlatform = 'youtube';
  private ytBroadcast: IYoutubeLiveBroadcast = null;
  private fbVideo: IFacebookLiveVideo = null;

  private get isUpdateMode(): boolean {
    return !!this.props.id;
  }

  private get view() {
    return this.streamingService.views;
  }

  private settings: IStreamSettings = required();
  private platforms = this.view.linkedPlatforms.filter(p =>
    this.view.supports('stream-schedule', [p]),
  );
  private startTimeModel = {
    time: 0,
  };
  private isLoading = false;

  created() {
    this.selectedPlatform = (this.props.platform || this.platforms[0]) as TPlatform;
    this.updateSettings();
  }

  @Watch('selectedPlatform')
  private async updateSettings() {
    // use goLive settings for schedule
    this.settings = cloneDeep(this.view.goLiveSettings);

    // delete not-selected platforms
    this.view.linkedPlatforms.forEach(p => {
      if (p !== this.selectedPlatform) {
        delete this.settings.platforms[p];
      } else {
        this.settings.platforms[p].enabled = true;
      }
    });

    // prepopulate info for target platforms
    this.streamingService.actions.prepopulateInfo([this.selectedPlatform]);

    if (this.isUpdateMode) {
      if (this.selectedPlatform === 'youtube') {
        this.ytBroadcast = await this.youtubeService.fetchBroadcast(this.props.id);
        this.settings.platforms.youtube = {
          ...this.settings.platforms.youtube,
          title: this.ytBroadcast.snippet.title,
          description: this.ytBroadcast.snippet.description,
        };
      } else {
        // this.fbVideo = await this.facebookService.fetchV
      }
    }
  }

  /**
   * validate settings and schedule stream
   */
  private async scheduleNewStream() {
    // validate
    if (!(await this.$refs.form.validate())) return;

    // take the date without hours and minutes
    const startDate = new Date(this.props.date).setHours(0, 0, 0, 0);

    // convert date to ISO string format
    const scheduledStartTime = new Date(startDate + this.startTimeModel.time * 1000).toISOString();

    // schedule
    try {
      this.isLoading = true;
      await this.streamingService.actions.return.scheduleStream(this.settings, scheduledStartTime);
      this.close();
    } catch (e) {
      this.$toasted.show(e.message, {
        position: 'bottom-center',
        className: 'toast-alert',
        duration: 50 * e.message.length,
        singleton: true,
      });
    } finally {
      this.isLoading = false;
    }
  }

  private close() {
    WindowsService.hideModal();
  }

  private remove() {
    const id = this.props.id;
    if (this.selectedPlatform === 'youtube') {
      this.youtubeService.actions.removeBroadcast(id);
    } else {
      this.facebookService.actions.removeLiveVideo(id);
    }
    this.close();
  }

  get formMetadata() {
    return formMetadata({
      platform: metadata.list({
        title: $t('Platform'),
        options: this.view.linkedPlatforms
          .filter(p => p !== 'twitch')
          .map(p => ({ title: p, value: p })),
        disabled: this.isUpdateMode,
      }),
      time: metadata.timer({
        title: $t('Scheduled Time'),
        format: 'hm',
        max: 24 * 3600,
      }),
    });
  }

  render() {
    const shouldShowLoading = this.isLoading || !this.view.isPrepopulated([this.selectedPlatform]);
    const shouldShowSettings = !shouldShowLoading;

    return (
      <ModalLayout customControls={true} showControls={false} class={styles.dialog}>
        <ValidatedForm ref="form" slot="content" name="editStreamForm" class="flex">
          <div style={{ width: '100%' }}>
            {shouldShowSettings && (
              <div>
                <HFormGroup metadata={this.formMetadata.platform} vModel={this.selectedPlatform} />
                <PlatformSettings vModel={this.settings} isScheduleMode={true} />
                <HFormGroup metadata={this.formMetadata.time} vModel={this.startTimeModel.time} />
              </div>
            )}
            {shouldShowLoading && <Spinner />}
          </div>
        </ValidatedForm>
        <div slot="controls">{this.renderControls()}</div>
      </ModalLayout>
    );
  }

  private renderControls() {
    const shouldShowUpdateButton = this.isUpdateMode;
    const shouldShowScheduleButton = !this.isUpdateMode;
    const shouldShowDeleteButton = this.isUpdateMode;

    return (
      <div class="controls" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {/* CANCEL BUTTON */}
        <button class={cx('button button--default')} onclick={() => this.close()}>
          {$t('Cancel')}
        </button>

        {/* DELETE BUTTON */}
        {shouldShowDeleteButton && (
          <button class={cx('button button--warn')} onClick={() => this.remove()}>
            {$t('Delete')}
          </button>
        )}

        {/* SCHEDULE BUTTON */}
        {shouldShowScheduleButton && (
          <button class={cx('button button--action')} onClick={() => this.scheduleNewStream()}>
            {$t('Schedule')}
          </button>
        )}

        {/* UPDATE BUTTON */}
        {shouldShowUpdateButton && (
          <button class={cx('button button--action')} onClick={() => this.close()}>
            {$t('Update')}
          </button>
        )}
      </div>
    );
  }
}
