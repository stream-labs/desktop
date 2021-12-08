import { Component } from 'vue-property-decorator';
import Vue from 'vue';
import { Inject } from 'services';
import { VirtualWebcamService, EVirtualWebcamPluginInstallStatus } from 'services/virtual-webcam';
import styles from './VirtualWebcamSettings.m.less';
import cx from 'classnames';
import { $t } from 'services/i18n';
import Translate from 'components/shared/translate';
import { getOS, OS } from 'util/operating-systems';

@Component({})
export default class AppearanceSettings extends Vue {
  @Inject() virtualWebcamService: VirtualWebcamService;

  installStatus: EVirtualWebcamPluginInstallStatus = null;

  created() {
    this.checkInstalled();
  }

  install() {
    // Intentionally synchronous. Call is blocking until user action in the worker
    // process, so we don't want the user doing anything else.
    this.virtualWebcamService.install();
    this.checkInstalled();
  }

  uninstall() {
    // Intentionally synchronous for the same reasons as above.
    this.virtualWebcamService.uninstall();
    this.checkInstalled();
  }

  start() {
    this.virtualWebcamService.actions.start();
  }

  stop() {
    this.virtualWebcamService.actions.stop();
  }

  async checkInstalled() {
    this.installStatus = await this.virtualWebcamService.getInstallStatus();
  }

  get running() {
    return this.virtualWebcamService.state.running;
  }

  needsInstallSection(isUpdate: boolean) {
    let message: string;

    // This is an if statement because ESLint literally doesn't know how to format as a ternary
    if (isUpdate) {
      message = $t(
        'The Virtual Webcam plugin needs to be updated before it can be started. This requires administrator privileges.',
      );
    } else {
      message = $t(
        'Virtual Webcam requires administrator privileges to be installed on your system.',
      );
    }
    const buttonText = isUpdate ? $t('Update Virtual Webcam') : $t('Install Virtual Webcam');

    return (
      <div class="section">
        <div class="section-content">
          <p>{message}</p>
          <button
            class="button button--action"
            style={{ marginBottom: '16px' }}
            onClick={this.install}
          >
            {buttonText}
          </button>
        </div>
      </div>
    );
  }

  isInstalledSection() {
    const buttonText = this.running ? $t('Stop Virtual Webcam') : $t('Start Virtual Webcam');
    const statusText = this.running
      ? $t('Virtual webcam is <status>Running</status>')
      : $t('Virtual webcam is <status>Offline</status>');

    return (
      <div class="section">
        <div class="section-content">
          <p>
            <Translate
              message={statusText}
              scopedSlots={{
                status: (text: string) => {
                  return (
                    <span class={cx({ [styles.running]: this.running })}>
                      <b>{text}</b>
                    </span>
                  );
                },
              }}
            />
          </p>
          <button
            class={cx('button', { 'button--action': !this.running, 'button--warn': this.running })}
            style={{ marginBottom: '16px' }}
            onClick={this.running ? this.stop : this.start}
          >
            {buttonText}
          </button>
          {getOS() === OS.Mac && (
            <p>
              {$t(
                'If the virtual webcam does not appear in other applications, you may need to restart your computer.',
              )}
            </p>
          )}
        </div>
      </div>
    );
  }

  uninstallSection() {
    return (
      <div class="section">
        <div class="section-content">
          <p>
            {$t(
              'Uninstalling Virtual Webcam will remove it as a device option in other applications.',
            )}
          </p>
          <button
            class="button button--default"
            style={{ marginBottom: '16px' }}
            disabled={this.running}
            onClick={this.uninstall}
          >
            {$t('Uninstall Virtual Webcam')}
          </button>
        </div>
      </div>
    );
  }

  getSection(status: EVirtualWebcamPluginInstallStatus) {
    if (status === EVirtualWebcamPluginInstallStatus.NotPresent) {
      return this.needsInstallSection(false);
    }
    if (status === EVirtualWebcamPluginInstallStatus.Outdated) {
      return this.needsInstallSection(true);
    }
    if (status === EVirtualWebcamPluginInstallStatus.Installed) {
      return this.isInstalledSection();
    }
  }

  render() {
    return (
      <div>
        <div class="section">
          <div class="section-content">
            <b>{$t('This is an experimental feature.')}</b>
            <p>
              {$t(
                'Virtual Webcam allows you to display your scenes from Streamlabs Desktop in video conferencing software. Streamlabs Desktop will appear as a Webcam that can be selected in most video conferencing apps.',
              )}
            </p>
          </div>
        </div>
        {this.installStatus && this.getSection(this.installStatus)}
        {this.installStatus &&
          this.installStatus !== EVirtualWebcamPluginInstallStatus.NotPresent &&
          this.uninstallSection()}
      </div>
    );
  }
}
