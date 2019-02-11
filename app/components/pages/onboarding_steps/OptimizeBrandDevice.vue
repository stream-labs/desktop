<template>
  <div>
    <div class="onboarding-step">
      <div class="onboarding-image"><img src="../../../../media/images/optimize.png"></div>

      <div class="onboarding-title">{{ $t('Optimize') }} {{ deviceName }}</div>

      <div class="onboarding-desc" v-if="status === ''">
        {{ $t('Collecting some information about your PC...') }}
      </div>

      <div class="onboarding-desc" v-if="status === 'init' || status === 'pending'">
        {{ $t('We found optimized settings for your PC') }}
      </div>

      <div v-if="status === 'fail'" class="onboarding-desc">
        {{ $t('Something went wrong') }}
      </div>

      <div v-if="status === 'success'" class="onboarding-desc">
        {{ $t('Streamlabs OBS is ready to go') }}
      </div>

      <button class="button button--action button--lg" v-if="status === 'init'" @click="install()">
        {{ $t('Download and Apply') }}
      </button>

      <button class="button button--default button--lg is-disabled" v-if="status === 'pending'">
        {{ $t('Downloading...') }}
      </button>

      <button class="button button--action button--lg" v-if="status === 'fail'" @click="install()">
        {{ $t('Retry') }}
      </button>

      <button class="button button--action button--lg" v-if="status === 'success'" @click="next()">
        {{ $t('OK') }}
      </button>

      <div class="setup-later" v-if="status === 'init' || status === 'fail'">
        <span>{{ $t('Rather do this manually?') }}</span>
        <a @click="skip">{{ $t('Setup later') }}</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./OptimizeBrandDevice.vue.ts"></script>
