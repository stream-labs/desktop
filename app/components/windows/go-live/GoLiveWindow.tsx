import TsxComponent from 'components/tsx-component';
import ModalLayout from 'components/ModalLayout.vue';
import { $t } from 'services/i18n';
import { Component, Watch } from 'vue-property-decorator';
import styles from './GoLive.m.less';
import { Inject } from 'services/core';
import { UserService } from 'services/user';
import { ToggleInput } from 'components/shared/inputs/inputs';
import cx from 'classnames';
import { SettingsService } from 'services/settings';
import { WindowsService } from 'services/windows';
import { IGoLiveSettings, StreamingService } from 'services/streaming';
import cloneDeep from 'lodash/cloneDeep';
import { StreamSettingsService } from 'services/settings/streaming';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import GoLiveSettings from './GoLiveSettings';
import GoLiveChecklist from './GoLiveChecklist';

/***
 * A window for stream starting
 */
@Component({})
export default class GoLiveWindow extends TsxComponent<{}> {
  @Inject() private userService: UserService;
  @Inject() private settingsService: SettingsService;
  @Inject() private streamingService!: StreamingService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private windowsService: WindowsService;

  $refs: {
    form: ValidatedForm;
  };

  private settings: IGoLiveSettings = cloneDeep(this.streamingService.views.goLiveSettings);

  private get view() {
    return this.streamingService.views;
  }

  private get lifecycle() {
    return this.view.info.lifecycle;
  }

  created() {
    if (['empty', 'waitingForNewSettings'].includes(this.lifecycle)) {
      this.streamingService.actions.prepopulateInfo();
    }
  }

  destroyed() {
    // clear failed checks and warnings on window close
    if (this.view.info.checklist.startVideoTransmission !== 'done') {
      this.streamingService.actions.resetInfo();
    }
  }

  @Watch('view.goLiveSettings')
  private onGoLiveSettingUpdateHandler() {
    // update local settings after settings for platforms have been prepopulated
    this.settings.platforms = cloneDeep(this.streamingService.views.goLiveSettings.platforms);
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

  /**
   * Return to the settings form from the error screen
   */
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
   * Renders GoLiveSettings or GoLiveChecklist component depending on the lifecycle step
   **/
  render() {
    const shouldShowSettings = ['empty', 'prepopulate', 'waitForNewSettings'].includes(
      this.lifecycle,
    );
    const shouldShowChecklist = ['runChecklist', 'live'].includes(this.lifecycle);

    return (
      <ModalLayout customControls={true} showControls={false}>
        <ValidatedForm
          ref="form"
          slot="content"
          handleExtraValidation={this.postValidate}
          style={{ position: 'relative', height: '100%' }}
          name="editStreamForm"
        >
          <transition name="zoom">
            {shouldShowSettings && <GoLiveSettings class={styles.page} vModel={this.settings} />}
            {shouldShowChecklist && <GoLiveChecklist class={styles.page} />}
          </transition>
        </ValidatedForm>
        <div slot="controls">{this.renderControls()}</div>
      </ModalLayout>
    );
  }

  private renderControls() {
    const shouldShowConfirm =
      this.lifecycle === 'waitForNewSettings' && this.view.enabledPlatforms.length > 0;
    const shouldShowGoBackButton =
      this.lifecycle === 'runChecklist' &&
      this.view.info.error &&
      this.view.info.checklist.startVideoTransmission !== 'done';
    const shouldShowAdvancedSwitch = shouldShowConfirm && this.view.isMultiplatformMode;

    return (
      <div class="controls" style={{ display: 'flex', 'flex-direction': 'row-reverse' }}>
        {/* GO LIVE BUTTON */}
        {shouldShowConfirm && (
          <button
            class={cx('button button--action', styles.goLiveButton)}
            onClick={() => this.goLive()}
          >
            {$t('Confirm & Go Live')}
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
            <div>{$t('Show Advanced Settings')}</div>
            <ToggleInput
              onInput={(val: boolean) => this.switchAdvancedMode(val)}
              value={this.settings.advancedMode}
              metadata={{ name: 'advancedMode' }}
            />
          </div>
        )}
      </div>
    );
  }
}
