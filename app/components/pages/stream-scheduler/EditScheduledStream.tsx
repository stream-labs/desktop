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
import { IStreamEvent, IStreamSettings, StreamingService } from 'services/streaming';
import { Spinner } from 'streamlabs-beaker';
import cloneDeep from 'lodash/cloneDeep';
import { StreamSettingsService } from 'services/settings/streaming';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import PlatformSettings from 'components/windows/go-live/PlatformSettings';
import { getPlatformService, TPlatform } from 'services/platforms';
import cx from 'classnames';
import { YoutubeService } from 'services/platforms/youtube';
import { FacebookService, IFacebookLiveVideo } from 'services/platforms/facebook';
import styles from './EditScheduledStream.m.less';
import { assertIsDefined } from 'util/properties-type-guards';

class Props {
  /**
   * if the date provided then component works in the "Create" mode
   */
  date?: number = 0;
  /**
   * if the event provided then component works in the "Update" mode
   */
  event?: IStreamEvent | null = null;
}

@Component({ props: createProps(Props) })
export default class EditScheduledStream extends TsxComponent<Props> {
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

  private get isUpdateMode(): boolean {
    return !!this.props.event;
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
    this.selectedPlatform = (this.props.event?.platform || this.platforms[0]) as TPlatform;
    this.updateSettings();
  }

  @Watch('selectedPlatform')
  private async updateSettings() {
    // use goLive settings for schedule
    this.settings = cloneDeep(this.view.goLiveSettings);

    // clear not-selected platforms
    this.view.linkedPlatforms.forEach(p => {
      if (p !== this.selectedPlatform) {
        delete this.settings.platforms[p];
      } else {
        this.$set(this.settings.platforms[p], 'enabled', true);
      }
    });

    // prepopulate info for target platforms
    this.streamingService.actions.prepopulateInfo([this.selectedPlatform]);

    if (this.isUpdateMode) {
      if (this.selectedPlatform === 'youtube') {
        this.settings.platforms.youtube = {
          ...this.settings.platforms.youtube,
          ...(await this.youtubeService.actions.return.fetchStartStreamOptionsForBroadcast(
            this.props.event.id,
          )),
        };
      } else {
        // it's a facebook event
        assertIsDefined(this.props.event.facebook);
        const { destinationType, destinationId } = this.props.event.facebook;
        this.settings.platforms.facebook = {
          ...this.settings.platforms.facebook,
          ...(await this.facebookService.actions.return.fetchStartStreamOptionsForVideo(
            this.props.event.id,
            destinationType,
            destinationId,
          )),
        };
      }
      // setup the time input
      const date = new Date(this.props.event.date);
      const seconds = date.getHours() * 60 * 60 + date.getMinutes() * 60;
      this.startTimeModel.time = seconds;
    }
  }

  /**
   * validate settings and schedule stream
   */
  private async save() {
    // validate
    if (!(await this.$refs.form.validate())) return;

    // take the date without hours and minutes
    const startDate = new Date(this.props.date || this.props.event.date).setHours(0, 0, 0, 0);

    // add hours and minutes
    const scheduledStartTime = new Date(startDate + this.startTimeModel.time * 1000).valueOf();

    try {
      this.isLoading = true;
      await this.streamingService.actions.return.scheduleStream(this.settings, scheduledStartTime);
      this.$toasted.show($t('Stream scheduled'), {
        position: 'bottom-center',
        duration: 3000,
        className: 'toast-success',
        singleton: true,
      });
      this.close();
    } catch (e) {
      const msg = e.details || e.message;
      this.$toasted.show(msg, {
        position: 'bottom-center',
        className: 'toast-alert',
        duration: 50 * msg.length,
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
    assertIsDefined(this.props.event);
    const id = this.props.event.id;
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
          .map(p => ({ title: getPlatformService(p).displayName, value: p })),
        disabled: this.isUpdateMode,
        fullWidth: true,
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
            <h1>{this.isUpdateMode ? $t('Update scheduled event') : $t('Schedule new stream')}</h1>
            {shouldShowSettings && (
              <div>
                <HFormGroup metadata={this.formMetadata.platform} vModel={this.selectedPlatform} />
                <PlatformSettings
                  vModel={this.settings}
                  isScheduleMode={true}
                  isUpdateMode={this.isUpdateMode}
                />
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
        {!this.isLoading && (
          <div>
            {/* DELETE BUTTON */}
            {shouldShowDeleteButton && (
              <button class={cx('button button--warn')} onClick={() => this.remove()}>
                {$t('Delete')}
              </button>
            )}

            {/* CANCEL BUTTON */}
            <button class={cx('button button--default')} onclick={() => this.close()}>
              {$t('Cancel')}
            </button>

            {/* SCHEDULE BUTTON */}
            {shouldShowScheduleButton && (
              <button class={cx('button button--action')} onClick={() => this.save()}>
                {$t('Schedule')}
              </button>
            )}

            {/* UPDATE BUTTON */}
            {shouldShowUpdateButton && (
              <button class={cx('button button--action')} onClick={() => this.save()}>
                {$t('Save')}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
}
