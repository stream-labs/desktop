import electron from 'electron';
import { CompactModeService } from 'services/compact-mode';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { UserService } from 'services/user';
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

@Component({})
export default class Login extends Vue {
  @Inject() userService: UserService;
  @Inject() compactModeService: CompactModeService;

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get username() {
    return this.userService.username;
  }
  get userIcon() {
    return this.userService.userIcon;
  }
  get userId() {
    return this.userService.platformId;
  }
  get userPageURL() {
    return this.userService.platformUserPageURL;
  }

  get isCompactMode(): boolean {
    return this.compactModeService.compactMode;
  }

  logout() {
    if (confirm($t('common.logoutConfirmMessage'))) {
      this.userService.logOut();
    }
  }

  login() {
    this.userService.showLogin();
  }

  openUserPage() {
    electron.remote.shell.openExternal(this.userPageURL);
  }
}
