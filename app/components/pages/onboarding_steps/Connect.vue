<template>
  <div>
    <div class="onboarding-step">
      <div class="onboarding-image"><img src="../../../../media/images/connect.png"></div>
      <div class="onboarding-title">Connect</div>
      <div class="onboarding-desc">Sign in with your Twitch, Youtube, Facebook, Twitter, or Mixer account to get started with Streamlabs</div>
      <div class="signup-buttons">
        <button
          class="square-button square-button--twitch"
          @click="authPlatform('twitch')">
          <i class="fa" :class="iconForPlatform('twitch')" />
        </button>
        <button
          class="square-button square-button--yt"
          @click="authPlatform('youtube')">
          <i class="fa" :class="iconForPlatform('youtube')" />
        </button>
        <button class="square-button square-button--fb"><i class="fa fa-facebook-official" /></button>
        <button class="square-button square-button--twitter"><i class="fa fa-twitter" /></button>
        <button class="square-button square-button--mixer"><i class="fa fa-gamepad" /></button>
      </div>
      <div class="setup-later">
        <a>Setup later</a>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService, TPlatform } from '../../../services/user';
import { Inject } from '../../../services/service';

@Component({})
export default class Connect extends Vue {

  @Inject()
  userService: UserService;

  loadingState: Dictionary<boolean> = {};

  authPlatform(platform: TPlatform) {
    Vue.set(this.loadingState, platform, true);
    this.userService.startAuth(platform).then(() => {
      this.loadingState[platform] = false;
    });
  }

  iconForPlatform(platform: TPlatform) {
    if (this.loadingState[platform]) return 'fa-spinner fa-spin';

    return {
      twitch: 'fa-twitch',
      youtube: 'fa-youtube-play'
    }[platform];
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