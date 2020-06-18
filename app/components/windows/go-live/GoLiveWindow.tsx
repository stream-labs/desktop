import TsxComponent from 'components/tsx-component';
import ModalLayout from 'components/ModalLayout.vue';
import { $t } from 'services/i18n';
import { Component, Watch } from 'vue-property-decorator';
import styles from './GoLive.m.less';
import { Inject } from 'services/core';
import { UserService } from 'services/user';
import { BoolInput, ToggleInput } from 'components/shared/inputs/inputs';
import cx from 'classnames';
import { formMetadata, IListOption, metadata } from 'components/shared/inputs';
import { SettingsService } from 'services/settings';
import HFormGroup from '../../shared/inputs/HFormGroup.vue';
import { IEncoderProfile } from 'services/video-encoding-optimizations';
import { WindowsService } from 'services/windows';
import { IGoLiveSettings, StreamingService } from 'services/streaming';

import { Spinner, ProgressBar } from 'streamlabs-beaker';
import cloneDeep from 'lodash/cloneDeep';
import { StreamSettingsService } from '../../../services/settings/streaming';
import ValidatedForm from '../../shared/inputs/ValidatedForm';
import Utils from '../../../services/utils';
import Translate from '../../shared/translate';
import GoLiveSettings from './GoLiveSettings';
import GoLiveChecklist from './GoLiveChecklist';
import GoLiveSuccess from './GoLiveSuccess';

/***
 * Windows that manages steps for streaming start
 */
@Component({})
export default class GoLiveWindow extends TsxComponent<{}> {
  @Inject() private userService: UserService;
  @Inject() private settingsService: SettingsService;
  @Inject() private streamingService: StreamingService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private windowsService: WindowsService;

  $refs: {
    form: ValidatedForm;
  };

  private settings: IGoLiveSettings = cloneDeep(this.streamingService.views.goLiveSettings);

  private get view() {
    return this.streamingService.views;
  }

  private get isAdvancedMode() {
    return this.view.goLiveSettings.advancedMode;
  }

  private get lifecycle() {
    return this.view.info.lifecycle;
  }

  async created() {
    // fetch platforms' data
    if (this.lifecycle === 'empty') {
      this.streamingService.actions.prepopulateInfo();
    }
  }

  private async switchAdvancedMode(enabled: boolean) {
    this.settings.advancedMode = enabled;
    this.streamSettingsService.setGoLiveSettings({ advancedMode: enabled });
  }

  /**
   * validate settings and go live
   */
  private async goLive() {
    if (!(await this.$refs.form.validate())) return;
    this.streamingService.actions.goLive(this.settings);
  }

  private close() {
    this.windowsService.actions.closeChildWindow();
  }

  private goBackToSettings() {
    this.streamingService.actions.prepopulateInfo();
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

  /**
   * Renders the child component depending on lifecycle step
   **/
  render() {
    const shouldShowSettings = ['empty', 'prepopulate', 'waitForNewSettings'].includes(
      this.lifecycle,
    );
    const shouldShowChecklist = this.lifecycle === 'runChecklist';
    const shouldShowSuccess = this.lifecycle === 'live';

    return (
      <ModalLayout customControls={true} showControls={false}>
        <ValidatedForm
          ref="form"
          slot="content"
          handleExtraValidation={this.postValidate}
          style={{ position: 'relative' }}
        >
          {shouldShowSettings && (
            <transition name="zoom">
              <GoLiveSettings class={styles.page} vModel={this.settings} />
            </transition>
          )}
          {shouldShowChecklist && (
            <transition name="zoom">
              <GoLiveChecklist class={styles.page} />
            </transition>
          )}
          {shouldShowSuccess && (
            <transition name="zoom">
              <GoLiveSuccess class={styles.page} />
            </transition>
          )}
        </ValidatedForm>
        <div slot="controls">{this.renderControls()}</div>
      </ModalLayout>
    );
  }

  private renderControls() {
    const shouldShowConfirm =
      this.lifecycle === 'waitForNewSettings' && this.view.availablePlatforms.length > 0;
    const shouldShowGoBackButton =
      this.lifecycle === 'runChecklist' &&
      this.view.info.error &&
      this.view.info.checklist.startVideoTransmission !== 'done';
    const shouldShowAdvancedSwitch = shouldShowConfirm && this.view.isMutliplatformMode;

    return (
      <div class="controls" style={{ display: 'flex', 'flex-direction': 'row-reverse' }}>
        {/* GO LIVE BUTTON */}
        {shouldShowConfirm && (
          <button
            class={cx('button button--action', styles.goLiveButton)}
            onClick={() => this.goLive()}
          >
            {$t('Confirm and Go Live')}
          </button>
        )}

        {/* GO BACK BUTTON */}
        {shouldShowGoBackButton && (
          <button
            class={cx('button button--action', styles.goLiveButton)}
            onClick={() => this.goBackToSettings()}
          >
            {$t('Go back to settings')}
          </button>
        )}

        {/* CLOSE BUTTON */}
        <button
          onClick={() => this.close()}
          class={cx('button button--default', styles.cancelButton)}
        >
          {$t('Close')}
        </button>

        {/* ADVANCED MODE SWITCHER */}
        {shouldShowAdvancedSwitch && (
          <div class={styles.modeToggle}>
            <HFormGroup
              onInput={(val: boolean) => this.switchAdvancedMode(val)}
              value={this.isAdvancedMode}
              metadata={metadata.toggle({ title: $t('Advanced Mode') })}
            />
          </div>
        )}
      </div>
    );
  }
}
