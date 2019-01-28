<template>
  <div>
    <div class="onboarding-step">
      <div class="onboarding-image"><img src="../../../../media/images/connect.png"></div>
      <div class="onboarding-title" v-if="isSecurityUpgrade">Re-Authorize</div>
      <div class="onboarding-title" v-else>Connect</div>
      <div class="onboarding-desc" v-if="isSecurityUpgrade">
        {{ $t('We are improving our backend systems. As part of the migration process, we will need to you log in again. If you have any questions, you can') }}
        <a @click="contactSupport">$t('contact support.')</a>
      </div>
      <div class="onboarding-desc" v-else>{{ $t('Sign in with your streaming account to get started with Streamlabs') }}</div>
      <div class="signup-buttons">
        <button
          class="button button--twitch"
          :disabled="loadingState"
          @click="authPlatform('twitch')">
          <i :class="iconForPlatform('twitch')" /> Twitch
        </button>
        <button
          class="button button--yt"
          :disabled="loadingState"
          @click="authPlatform('youtube')">
          <i :class="iconForPlatform('youtube')" /> Youtube
        </button>
        <button
          class="button button--mixer"
          :disabled="loadingState"
          @click="authPlatform('mixer')">
          <i :class="iconForPlatform('mixer')" /> Mixer
        </button>
        <button
          class="button button--fb"
          :disabled="loadingState"
          @click="authPlatform('facebook')">
          <i :class="iconForPlatform('facebook')" /> Facebook
        </button>
      </div>
      <div class="setup-later" v-if="!isSecurityUpgrade">
        <a @click="skipOnboarding">{{ $t('Setup later')}}</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./Connect.vue.ts"></script>

<style lang="less" scoped>
  .signup-buttons {
    display: flex;
    flex-direction: column;
    width: 100%;
    align-items: center;

    button {
      margin: 8px 0;
      width: 100%;
    }
  }
</style>
