import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import electron, { ipcRenderer } from 'electron';
import cx from 'classnames';
import { CustomizationService } from 'services/customization';
import { Inject } from 'services/core/injector';
import { StreamingService } from 'services/streaming';
import KevinSvg from 'components/shared/KevinSvg';
import Utils from 'services/utils';
import { $t } from 'services/i18n';
import styles from './TitleBar.m.less';

@Component({})
export default class TitleBar extends Vue {
  @Inject() customizationService: CustomizationService;
  @Inject() streamingService: StreamingService;

  @Prop() title: string;

  created() {
    if (Utils.isDevMode()) {
      ipcRenderer.on('unhandledErrorState', () => {
        this.errorState = true;
      });
    }
  }

  minimize() {
    electron.remote.getCurrentWindow().minimize();
  }

  get isMaximizable() {
    return electron.remote.getCurrentWindow().isMaximizable() !== false;
  }

  maximize() {
    const win = electron.remote.getCurrentWindow();

    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }

  close() {
    if (Utils.isMainWindow() && this.streamingService.isStreaming) {
      if (!confirm($t('Are you sure you want to exit while live?'))) return;
    }

    electron.remote.getCurrentWindow().close();
  }

  get theme() {
    return this.customizationService.currentTheme;
  }

  get primeTheme() {
    return /prime/.test(this.theme);
  }

  errorState = false;

  render() {
    return (
      <div
        class={cx(styles.titlebar, this.theme)}
        style={{ backgroundColor: this.errorState ? 'var(--red)' : undefined }}
      >
        {!this.primeTheme && (
          <img class={styles.titlebarIcon} src={require('../../media/images/icon.ico')} />
        )}
        {this.primeTheme && <KevinSvg class={styles.titlebarIcon} />}
        <div class={styles.titlebarTitle}>{this.title}</div>
        <div class={styles.titlebarActions}>
          <i class={cx('icon-subtract', styles.titlebarAction)} onClick={() => this.minimize()} />
          {this.isMaximizable && (
            <i class={cx('icon-expand-1', styles.titlebarAction)} onClick={() => this.maximize()} />
          )}
          <i class={cx('icon-close', styles.titlebarAction)} onClick={() => this.close()} />
        </div>
      </div>
    );
  }
}
