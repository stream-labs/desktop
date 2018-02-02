import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { OnboardingService } from 'services/onboarding';
import { Inject } from 'util/injector';

@Component({})
export default class Login extends Vue {
  @Inject() userService: UserService;
  @Inject() onboardingService: OnboardingService;

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get username() {
    return this.userService.username;
  }

  logout() {
    if (confirm('Are you sure you want to log out?')) {
      this.userService.logOut();
    }
  }

  login() {
    this.onboardingService.start({ isLogin: true });
  }

}
