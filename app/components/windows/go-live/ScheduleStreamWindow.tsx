import TsxComponent from 'components/tsx-component';
import ModalLayout from 'components/ModalLayout.vue';
import { $t } from 'services/i18n';
import { Component } from 'vue-property-decorator';
import styles from './GoLive.m.less';
import { Inject } from 'services/core';
import { UserService } from 'services/user';
import { formMetadata, IListOption, metadata } from 'components/shared/inputs';
import { SettingsService } from 'services/settings';
import HFormGroup from '../../shared/inputs/HFormGroup.vue';
import { WindowsService } from 'services/windows';
import { IGoLiveSettings, IStreamSettings, StreamingService } from 'services/streaming';

import { Spinner, ProgressBar } from 'streamlabs-beaker';
import cloneDeep from 'lodash/cloneDeep';
import { StreamSettingsService } from '../../../services/settings/streaming';
import ValidatedForm from '../../shared/inputs/ValidatedForm';
import Utils from '../../../services/utils';
import PlatformSettings from './PlatformSettings';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import { DestinationSwitchers } from './DestinationSwitchers';
import moment from 'moment';

/***
 * Windows that manages steps for streaming start
 */
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

  private settings: IStreamSettings = null;
  private eligiblePlatforms = this.view.linkedPlatforms.filter(p =>
    this.view.supports('stream-schedule', p),
  );
  private startTimeModel = {
    date: Date.now(),
    time: 0,
  };
  private isLoading = false;

  get selectedDestinations(): TPlatform[] {
    const destinations = this.settings.destinations;
    return Object.keys(destinations).filter(dest => destinations[dest].enabled) as TPlatform[];
  }

  created() {
    this.settings = cloneDeep(this.view.goLiveSettings);
    this.settings.advancedMode = false;
    const destinations = this.settings.destinations;
    Object.keys(destinations).forEach((dest: TPlatform) => {
      destinations[dest].enabled = true;
      if (!this.eligiblePlatforms.includes(dest)) delete destinations[dest];
    });
    this.streamingService.actions.prepopulateInfo(this.selectedDestinations);
  }

  /**
   * validate settings and schedule stream
   */
  private async submit() {
    if (!(await this.$refs.form.validate())) return;
    const scheduledStartTime = new Date(
      this.startTimeModel.date + this.startTimeModel.time * 1000,
    ).toISOString();

    try {
      this.isLoading = true;
      await this.streamingService.actions.return.scheduleStream(this.settings, scheduledStartTime);
      this.startTimeModel = { time: null, date: null };
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
    return this.settings.destinations.facebook?.enabled;
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
            <DestinationSwitchers vModel={this.settings.destinations} canDisablePrimary={true} />
          </div>
          <div style={{ width: '100%' }}>
            {shouldShowSettings && (
              <div>
                <PlatformSettings vModel={this.settings} />
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
