<template>
  <div>
    <div class="onboarding-step">
      <div class="onboarding-image"><img src="../../../../media/images/connect.png"></div>
      <div class="onboarding-title">Connect</div>
      <div class="onboarding-desc">Sign in with your Twitch, Youtube, Facebook, Twitter, or Mixer account to get started with Streamlabs</div>
      <div class="signup-buttons">
        <button class="square-button square-button--twitch"><i class="fa fa-twitch" /></button>
        <button class="square-button square-button--yt"><i class="fa fa-youtube-play" /></button>
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

@Component({})
export default class Connect extends Vue {

}
</script>
<style lang="less" scoped>
  .signup-buttons {
    display: flex;
    width: 100%;
    justify-content: space-between;
  }
</style>