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
import { WindowsService } from 'services/windows';
import { byOS, OS } from 'util/operating-systems';
import styles from './TitleBar.m.less';
import TsxComponent, { createProps } from './tsx-component';

class TitleBarProps {
  title: string = '';
}

@Component({ props: createProps(TitleBarProps) })
export default class TitleBar extends TsxComponent<TitleBarProps> {
  @Inject() customizationService: CustomizationService;
  @Inject() streamingService: StreamingService;
  @Inject() windowsService: WindowsService;

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

  get isMac() {
    return byOS({ [OS.Windows]: false, [OS.Mac]: true });
  }

  get primeTheme() {
    return /prime/.test(this.theme);
  }

  errorState = false;

  render() {
    return (
      <div
        class={cx(styles.titlebar, this.theme, {
          [styles['titlebar-mac']]: this.isMac,
          [styles.titlebarError]: this.errorState,
        })}
      >
        {!this.primeTheme && !this.isMac && (
          <img class={styles.titlebarIcon} src={require('../../media/images/icon.ico')} />
        )}
        {this.primeTheme && !this.isMac && <KevinSvg class={styles.titlebarIcon} />}
        <div class={styles.titlebarTitle} onDblclick={() => this.maximize()}>
          {this.props.title}
        </div>
        {!this.isMac && (
          <div class={styles.titlebarActions}>
            <i class={cx('icon-subtract', styles.titlebarAction)} onClick={() => this.minimize()} />
            {this.isMaximizable && (
              <i
                class={cx('icon-expand-1', styles.titlebarAction)}
                onClick={() => this.maximize()}
              />
            )}
            <i class={cx('icon-close', styles.titlebarAction)} onClick={() => this.close()} />
          </div>
        )}
      </div>
    );
  }
}
