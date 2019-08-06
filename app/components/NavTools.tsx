import Vue from 'vue';
import cx from 'classnames';
import electron from 'electron';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { NavigationService, TAppPage } from 'services/navigation';
import { UserService } from 'services/user';
import { SettingsService } from 'services/settings';
import Utils from 'services/utils';
import { TransitionsService } from 'services/transitions';
import { $t } from 'services/i18n';
import styles from './SideNav.m.less';

@Component({})
export default class SideNav extends Vue {
  @Inject() userService: UserService;
  @Inject() transitionsService: TransitionsService;
  @Inject() settingsService: SettingsService;
  @Inject() navigationService: NavigationService;

  get isDevMode() {
    return Utils.isDevMode();
  }

  openSettingsWindow() {
    this.settingsService.showSettings();
  }

  navigate(page: TAppPage) {
    this.navigationService.navigate(page);
  }

  openDevTools() {
    electron.ipcRenderer.send('openDevTools');
  }

  handleAuth() {
    if (this.userService.isLoggedIn()) {
      electron.remote.dialog.showMessageBox(
        {
          title: $t('Confirm'),
          message: $t('Are you sure you want to log out?'),
          buttons: [$t('Yes'), $t('No')],
        },
        index => {
          if (index === 0) {
            this.userService.logOut();
          }
        },
      );
    } else {
      this.userService.showLogin();
    }
  }

  studioMode() {
    if (this.transitionsService.state.studioMode) {
      this.transitionsService.disableStudioMode();
    } else {
      this.transitionsService.enableStudioMode();
    }
  }

  get studioModeEnabled() {
    return this.transitionsService.state.studioMode;
  }

  render(h: Function) {
    return (
      <div class={styles.bottomTools}>
        {this.isDevMode && (
          <div class={styles.cell} onClick={this.openDevTools.bind(this)} title={$t('Dev Tools')}>
            <i class="icon-developer" />
          </div>
        )}
        <div
          class={cx(styles.cell, { [styles.toggleOn]: this.studioModeEnabled })}
          onClick={this.studioMode.bind(this)}
          title={$t('Studio Mode')}
        >
          <i class="icon-studio-mode-3" />
        </div>
        <div
          class={styles.cell}
          onClick={() => this.handleAuth()}
          title={this.userService.isLoggedIn() ? $t('Logout') : $t('Login')}
        >
          <i class={this.userService.isLoggedIn() ? 'fas fa-sign-out-alt' : 'fas fa-sign-in-alt'} />
        </div>
        <div class={styles.cell} onClick={() => this.navigate('Help')} title={$t('Get Help')}>
          <i class="icon-question" />
        </div>
        <div
          class={styles.cell}
          onClick={this.openSettingsWindow.bind(this)}
          title={$t('Settings')}
        >
          <i class="icon-settings" />
        </div>
      </div>
    );
  }
}
