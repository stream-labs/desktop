<template>
  <div>
    <div class="onboarding-step">
      <div class="onboarding-image"><img src="../../../../media/images/connect.png"></div>
      <div class="onboarding-title" v-if="isSecurityUpgrade">Re-Authorize</div>
      <div class="onboarding-title" v-else>Connect</div>
      <div class="onboarding-desc" v-if="isSecurityUpgrade">
        We are improving our backend systems. As part of the migration process, we will need to you log in again. If you have any questions, you can
        <a @click="contactSupport">contact support.</a>
      </div>
      <div class="onboarding-desc" v-else>Sign in with your Twitch or Youtube account to get started with Streamlabs</div>
      <div class="signup-buttons">
        <button
          class="button button--twitch"
          :disabled="loadingState"
          @click="authPlatform('twitch')">
          <i class="fa" :class="iconForPlatform('twitch')" /> Twitch
        </button>
        <button
          class="button button--yt"
          :disabled="loadingState"
          @click="authPlatform('youtube')">
          <i class="fa" :class="iconForPlatform('youtube')" /> Youtube
        </button>
      </div>
      <div class="setup-later" v-if="!isSecurityUpgrade">
        <a @click="skipOnboarding">Setup later</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./Connect.vue.ts"></script>

<style lang="less" scoped>
  .signup-buttons {
    display: flex;
    width: 100%;
    justify-content: space-between;
  }
</style>
