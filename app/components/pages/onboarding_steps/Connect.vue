<template>
  <div class="main" data-test="Connect">
    <div class="onboarding-step">
      <NAirLogo />
      <div class="onboarding-title" v-if="isSecurityUpgrade">Re-Authorize</div>
      <div class="onboarding-desc" v-if="isSecurityUpgrade">
        {{ $t('onboarding.secutityUpgrade') }}
        <a @click="contactSupport">{{ $t('onboarding.contactSupport') }}</a>
      </div>
      <div class="onboarding-desc" v-else>{{ $t('onboarding.urgeToSignIn') }}</div>
      <div class="signup-buttons">
        <button
          class="button button--niconico"
          :disabled="loadingState"
          @click="authPlatform('niconico')"
          data-test="NiconicoSignup">
          <i class="fa" :class="iconForPlatform('niconico')" /> {{ $t('onboarding.loginToNiconico') }}
        </button>
      </div>
      <button
        @click="skipOnboarding"
        class="button button--skip"
        :disabled="loadingState"
        v-if="!isSecurityUpgrade"
        data-test="Skip">{{ $t('onboarding.skipConnect')}}</button>
      <footer>©DWANGO Co.,Ltd.</footer>
    </div>
  </div>
</template>

<script lang="ts" src="./Connect.vue.ts"></script>

<style lang="less" scoped>
.onboarding-step {
  > svg {
    width: 256px;
    margin-bottom: 30px;
  }
}
.signup-buttons {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;

  button {
    margin-bottom: 24px;
  }
}
footer {
  position: fixed;
  color: #70A0AF;
  bottom: 0;
  width: 100%;
  padding: 8px;
}

.icon-spin {
  animation: icon-spin 2s infinite linear;
}

@keyframes icon-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(359deg);
  }
}

</style>
