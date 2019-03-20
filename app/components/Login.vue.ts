import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { $t } from 'services/i18n';

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
    if (confirm($t('Are you sure you want to log out?'))) {
      this.userService.logOut();
    }
  }

  login() {
    this.userService.showLogin();
  }
}
