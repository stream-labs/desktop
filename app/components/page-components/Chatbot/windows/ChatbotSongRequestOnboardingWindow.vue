<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
>
  <div slot="fixed" class="onboarding-header__container">
    <div v-if="step === 1">
      {{ $t('Step 1: Choose your setting') }}
    </div>
    <div v-if="step === 2">
      {{ $t('Set up your Song Request') }}
    </div>
  </div>
  <div slot="content">
    <div v-if="settings" class="row onboarding-sections__container">
      <div
        v-for="(option, index) in onboardingData"
        :key="index"
        class="col-xs-6"
      >
        <div class="onboarding-section">
          <div>
            <img class="onboarding-section__image" :src="option.backgroundUrl" height='200'/>
            <label class="onboarding-section__label" v-if="option.subtitle"> {{ option.subtitle }} </label>
            <h2> {{ option.title }} </h2>
            <p> {{ option.description }} </p>
          </div>
          <button
            v-if="option.onChooseHandler"
            class="button button--action button--full-width width--100"
            @click="option.onChooseHandler"
          >
            {{ $t('Choose') }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <div slot="controls">
    <button
      v-if="step > 1"
      class="button button--default"
      @click="onTogglePrevHandler">
      {{ $t('Back') }}
    </button>
    <button
      class="button button--action"
      @click="onToggleNextHandler"
    >
      {{ step > 1 ? $t('Got It') : $t('Next') }}
    </button>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotSongRequestOnboardingWindow.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";
.onboarding-header__container {
  .padding-h-sides(4);
  .padding-v-sides(2);
  font-size: 16px;
}
.onboarding-sections__container {
  .margin(0);
  .margin-top(4);
  .padding(0.25);
}
.onboarding-section {
  .padding(2);
  .margin(0.25);
  .radius();
  height: 370px;
  .flex();
  .flex--column();
  .flex--space-between();
  background-color: @day-secondary;

  .onboarding-section__image {
    height: 120px;
    display: block;
    margin: auto;
    .margin-bottom(2);
  }

  .onboarding-section__label {
    text-transform: uppercase;
  }
}

.night-theme {
  .onboarding-section {
    background-color: @night-accent-light;
  }
}
</style>
