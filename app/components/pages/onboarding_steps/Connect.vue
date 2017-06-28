<template>
  <div>
    <div class="onboarding-step">
      <div class="onboarding-image"><img src="../../../../media/images/connect.png"></div>
      <div class="onboarding-title">Connect</div>
      <div class="onboarding-desc">Sign in with your Twitch or Youtube account to get started with Streamlabs</div>
      <div class="signup-buttons">
        <button
          class="button button--twitch"
          @click="authPlatform('twitch')">
          <i class="fa" :class="iconForPlatform('twitch')" /> Twitch
        </button>
        <button
          class="button button--yt"
          @click="authPlatform('youtube')">
          <i class="fa" :class="iconForPlatform('youtube')" /> Youtube
        </button>
      </div>
      <div class="setup-later">
        <a @click="skipOnboarding">Setup later</a>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from '../../../services/user';
import { TPlatform } from '../../../services/platforms';
import { Inject } from '../../../services/service';
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
    this.onboardingService.finish();
  }

}
</script>
<style lang="less" scoped>
  .signup-buttons {
    display: flex;
    width: 100%;
    justify-content: space-between;
  }
</style>