import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from '../../../services/user';
import { TPlatform } from '../../../services/platforms';
import { Inject } from '../../../util/injector';
import { OnboardingService } from '../../../services/onboarding';

@Component({})
export default class Connect extends Vue {

  @Inject()
  userService: UserService;

  @Inject()
  onboardingService: OnboardingService;

  loadingState: Dictionary<boolean> = {};

  authPlatform(platform: TPlatform) {
    Vue.set(this.loadingState, platform, true);
    this.userService.startAuth(
      platform,
      () => {
        this.loadingState[platform] = false;
      },
      () => {
        this.onboardingService.next();
      }
    );
  }

  iconForPlatform(platform: TPlatform) {
    if (this.loadingState[platform]) return 'fa-spinner fa-spin';

    return {
      twitch: 'fa-twitch',
      youtube: 'fa-youtube-play'
    }[platform];
  }

  skipOnboarding() {
    this.onboardingService.skip();
  }

}
