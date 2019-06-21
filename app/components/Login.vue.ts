import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import electron from 'electron';

@Component({})
export default class Login extends Vue {
  @Inject() userService: UserService;

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get username() {
    return this.userService.username;
  }

  logout() {
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
  }

  login() {
    this.userService.showLogin();
  }
}
