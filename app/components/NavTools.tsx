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
import { MagicLinkService } from 'services/magic-link';
import { throttle } from 'lodash-decorators';
import { RestreamService } from 'services/restream';

@Component({})
export default class SideNav extends Vue {
  @Inject() userService: UserService;
  @Inject() transitionsService: TransitionsService;
  @Inject() settingsService: SettingsService;
  @Inject() navigationService: NavigationService;
  @Inject() magicLinkService: MagicLinkService;
  @Inject() restreamService: RestreamService;

  get isDevMode() {
    return Utils.isDevMode();
  }

  openSettingsWindow(categoryName?: string) {
    this.settingsService.showSettings(categoryName);
  }

  navigate(page: TAppPage) {
    this.navigationService.navigate(page);
  }

  openDevTools() {
    electron.ipcRenderer.send('openDevTools');
  }

  handleAuth() {
    if (this.userService.isLoggedIn()) {
      electron.remote.dialog
        .showMessageBox({
          title: $t('Confirm'),
          message: $t('Are you sure you want to log out?'),
          buttons: [$t('Yes'), $t('No')],
        })
        .then(({ response }) => {
          if (response === 0) {
            this.userService.logOut();
          }
        });
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

  dashboardOpening = false;

  @throttle(2000, { trailing: false })
  async openDashboard() {
    if (this.dashboardOpening) return;
    this.dashboardOpening = true;

    try {
      const link = await this.magicLinkService.getDashboardMagicLink();
      electron.remote.shell.openExternal(link);
    } catch (e) {
      console.error('Error generating dashboard magic link', e);
    }

    this.dashboardOpening = false;
  }

  openHelp() {
    electron.remote.shell.openExternal('https://howto.streamlabs.com/');
  }

  render() {
    return (
      <div class={styles.bottomTools}>
        {this.isDevMode && (
          <div class={styles.cell} onClick={() => this.openDevTools()} title={'Dev Tools'}>
            <i class="icon-developer" />
          </div>
        )}
        {this.restreamService.canEnableRestream && (
          <div
            class={cx(styles.cell)}
            onClick={() => this.openSettingsWindow('Stream')}
            title={$t('Multistream')}
          >
            <i class="fas fa-globe" />
            <div class={cx(styles.badge, styles.newBadge)}>{$t('New')}</div>
          </div>
        )}
        {this.userService.isLoggedIn() && (
          <div class={cx(styles.cell)} onClick={() => this.openDashboard()} title={$t('Dashboard')}>
            <i class="icon-dashboard" />
          </div>
        )}
        <div
          class={styles.cell}
          onClick={() => this.navigate('LayoutEditor')}
          title={$t('Layout Editor')}
        >
          <i class="fas fa-th-large" />
        </div>
        <div
          class={cx(styles.cell, { [styles.toggleOn]: this.studioModeEnabled })}
          onClick={this.studioMode.bind(this)}
          title={$t('Studio Mode')}
        >
          <i class="icon-studio-mode-3" />
        </div>
        <div class={styles.cell} onClick={() => this.openHelp()} title={$t('Get Help')}>
          <i class="icon-question" />
        </div>
        <div
          class={styles.cell}
          onClick={() => this.handleAuth()}
          title={
            this.userService.isLoggedIn()
              ? $t('Logout %{username}', { username: this.userService.username })
              : $t('Login')
          }
        >
          <i class={this.userService.isLoggedIn() ? 'fas fa-sign-out-alt' : 'fas fa-sign-in-alt'} />
        </div>
        <div class={styles.cell} onClick={() => this.openSettingsWindow()} title={$t('Settings')}>
          <i class="icon-settings" />
        </div>
      </div>
    );
  }
}
