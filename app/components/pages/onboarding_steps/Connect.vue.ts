import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { TPlatform } from 'services/platforms';
import { Inject } from 'util/injector';
import { OnboardingService } from 'services/onboarding';
import electron from 'electron';

@Component({})
export default class Connect extends Vue {
  @Inject() userService: UserService;
  @Inject() onboardingService: OnboardingService;

  loadingState = false;

  authPlatform(platform: TPlatform) {
    this.loadingState = true;
    this.userService.startAuth(
      platform,
      () => {
        this.loadingState = false;
      },
      () => {
        this.loadingState = true;
      },
      () => {
        this.onboardingService.next();
      }
    );
  }

  iconForPlatform(platform: TPlatform) {
    if (this.loadingState) return 'fas fa-spinner fa-spin';

    return {
      twitch: 'fab fa-twitch',
      youtube: 'fab fa-youtube',
      mixer: 'fas fa-times',
      facebook: 'fab fa-facebook'
    }[platform];
  }

  skipOnboarding() {
    this.onboardingService.skip();
  }

  get isSecurityUpgrade() {
    return this.onboardingService.options.isSecurityUpgrade;
  }

  contactSupport() {
    electron.remote.shell.openExternal('https://support.streamlabs.com');
  }

}
