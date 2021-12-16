import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'services/core/injector';
import { CustomizationService } from 'services/customization';
import { $t } from 'services/i18n';
import electron from 'electron';

@Component({})
export default class Login extends Vue {
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;

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

  get compactMode(): boolean {
    return this.customizationService.state.compactMode;
  }

  logout() {
    if (confirm($t('common.logoutConfirmMessage'))) {
      this.userService.logOut();
    }
  }

  login() {
    this.userService.showLogin();
  }

  openUserpage() {
    electron.remote.shell.openExternal(this.userPageURL);
  }
}
