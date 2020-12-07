import TsxComponent, { required } from 'components/tsx-component';
import ModalLayout from 'components/ModalLayout.vue';
import { $t } from 'services/i18n';
import { Component } from 'vue-property-decorator';
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
import PlatformSettings from './PlatformSettings';
import { TPlatform } from 'services/platforms';
import { DestinationSwitchers } from './DestinationSwitchers';
import moment from 'moment';

@Component({})
export default class ScheduleStreamWindow extends TsxComponent<{}> {
  @Inject() private userService: UserService;
  @Inject() private settingsService: SettingsService;
  @Inject() private streamingService: StreamingService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private windowsService: WindowsService;

  $refs: {
    form: ValidatedForm;
  };

  private get view() {
    return this.streamingService.views;
  }

  private settings: IStreamSettings = required();
  private eligiblePlatforms = this.view.linkedPlatforms.filter(p =>
    this.view.supports('stream-schedule', [p]),
  );
  private startTimeModel = {
    date: Date.now(),
    time: 0,
  };
  private isLoading = false;

  get selectedDestinations(): TPlatform[] {
    const destinations = this.settings.platforms;
    return Object.keys(destinations).filter(dest => destinations[dest].enabled) as TPlatform[];
  }

  created() {
    // use goLive settings for schedule
    this.settings = cloneDeep(this.view.goLiveSettings);

    // always show a simple mode only
    this.settings.advancedMode = false;

    // always have all platforms enabled when show window
    const destinations = this.settings.platforms;
    Object.keys(destinations).forEach((dest: TPlatform) => {
      destinations[dest].enabled = true;
      if (!this.eligiblePlatforms.includes(dest)) delete destinations[dest];
    });

    // prepopulate info for target platforms
    this.streamingService.actions.prepopulateInfo(this.selectedDestinations);
  }

  /**
   * validate settings and schedule stream
   */
  private async submit() {
    // validate
    if (!(await this.$refs.form.validate())) return;

    // take the date without hours and minutes
    const startDate = new Date(this.startTimeModel.date).setHours(0, 0, 0, 0);

    // convert date to ISO string format
    const scheduledStartTime = new Date(startDate + this.startTimeModel.time * 1000).toISOString();

    // schedule
    try {
      this.isLoading = true;
      await this.streamingService.actions.return.scheduleStream(this.settings, scheduledStartTime);
      this.startTimeModel = { time: 0, date: 0 };
      this.$toasted.show(
        $t(
          'Your stream has been scheduled for %{time} from now.' +
            " If you'd like to make another schedule please enter a different time",
          { time: moment().to(scheduledStartTime, true) },
        ),
        {
          position: 'bottom-center',
          fullWidth: true,
          className: 'toast-success toast-success__schedule',
          duration: 0,
          action: {
            text: $t('Close'),
            class: 'toast-action',
            onClick: (_e, toastedObject) => toastedObject.goAway(),
          },
        },
      );
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

  /**
   * Perform extra validations
   */
  private postValidate(): boolean {
    const errorMsg = this.view.validateSettings(this.settings);
    if (!errorMsg) return true;

    this.$toasted.error(errorMsg, {
      position: 'bottom-center',
      duration: 2000,
      singleton: true,
    });
    return false;
  }

  private get isFacebook() {
    return this.settings.platforms.facebook?.enabled;
  }

  get formMetadata() {
    return formMetadata({
      date: metadata.date({
        title: $t('Scheduled Date'),
        disablePastDates: true,
        required: true,
        description: this.isFacebook
          /* eslint-disable */
          ? $t(
            'Please schedule no further than 7 days in advance and no sooner than 10 minutes in advance.',
          )
          : undefined,
          /* eslint-enable */
      }),
      time: metadata.timer({
        title: $t('Scheduled Time'),
        format: 'hm',
        max: 24 * 3600,
      }),
    });
  }

  private switchPlatform(platform: TPlatform, enabled: boolean) {
    this.settings.platforms[platform].enabled = enabled;
  }

  render() {
    const shouldShowLoading =
      this.isLoading || !this.view.isPrepopulated(this.selectedDestinations);
    const shouldShowWarn = !shouldShowLoading && this.selectedDestinations.length === 0;
    const shouldShowSettings = !shouldShowWarn && !shouldShowLoading;

    return (
      <ModalLayout doneHandler={() => this.submit()}>
        <ValidatedForm
          ref="form"
          slot="content"
          handleExtraValidation={this.postValidate}
          name="editStreamForm"
          class="flex"
        >
          <div style={{ width: '400px', marginRight: '42px' }}>
            <DestinationSwitchers
              platforms={this.settings.platforms}
              handleOnPlatformSwitch={(...args) => this.switchPlatform(...args)}
              canDisablePrimary={true}
            />
          </div>
          <div style={{ width: '100%' }}>
            {shouldShowSettings && (
              <div>
                <PlatformSettings vModel={this.settings} isScheduleMode={true} />
                <HFormGroup metadata={this.formMetadata.date} vModel={this.startTimeModel.date} />
                <HFormGroup metadata={this.formMetadata.time} vModel={this.startTimeModel.time} />
              </div>
            )}
            {shouldShowWarn && <div>{$t('Select at least one destination')}</div>}
            {shouldShowLoading && <Spinner />}
          </div>
        </ValidatedForm>
      </ModalLayout>
    );
  }
}
