import { Component } from 'vue-property-decorator';
import Vue from 'vue';
import { Inject } from 'services';
import { VirtualWebcamService, EVirtualWebcamPluginInstallStatus } from 'services/virtual-webcam';
import styles from './VirtualWebcamSettings.m.less';
import cx from 'classnames';
import { byOS, OS } from 'util/operating-systems';

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
    const message = isUpdate
      ? 'The Virtual Webcam plugin needs to be updated before it can be started. This requires administrator privileges.'
      : 'Virtual Webcam requires administrator privileges to be installed on your system.';
    const buttonText = isUpdate ? 'Update Virtual Webcam' : 'Install Virtual Webcam';

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
    const buttonText = this.running ? 'Stop Virtual Webcam' : 'Start Virtual Webcam';

    return (
      <div class="section">
        <div class="section-content">
          <p>
            Virtual Webcam is{' '}
            <span class={cx({ [styles.running]: this.running })}>
              <b>{this.running ? 'Running' : 'Offline'}</b>
            </span>
          </p>
          <button
            class={cx('button', { 'button--action': !this.running, 'button--warn': this.running })}
            style={{ marginBottom: '16px' }}
            onClick={this.running ? this.stop : this.start}
          >
            {buttonText}
          </button>
        </div>
      </div>
    );
  }

  getSection(status: EVirtualWebcamPluginInstallStatus) {
    return byOS({
      [OS.Mac]: () => {
        if (status === EVirtualWebcamPluginInstallStatus.NotPresent) {
          return this.needsInstallSection(false);
        }
        if (status === EVirtualWebcamPluginInstallStatus.Outdated) {
          return this.needsInstallSection(true);
        }
        if (status === EVirtualWebcamPluginInstallStatus.Installed) {
          return this.isInstalledSection();
        }
      },
      [OS.Windows]: () => {
        let sections = [];
        sections.push(this.needsInstallSection(false));
        sections.push(this.isInstalledSection());

        return (
          <div>
              {sections}
          </div>
        );
      },
    });
  }

  render() {
    return (
      <div>
        <div class="section">
          <div class="section-content">
            <b>This is an experimental feature.</b>
            <p>
              Virtual Webcam allows you to display your scenes from Streamlabs OBS in video
              conferencing software. Streamlabs OBS will appear as a Webcam that can be selected in
              most video video conferencing apps.
            </p>
          </div>
        </div>
        {this.installStatus && this.getSection(this.installStatus)}
      </div>
    );
  }
}
