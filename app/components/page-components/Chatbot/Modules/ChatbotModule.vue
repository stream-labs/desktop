<template>
<div>
  <div
    class="chatbot-module__container"
    :class="{'chatbot-module__container--coming-soon': chatbotModule.comingSoon}"
  >
    <div class="chatbot-module__header">
      <h3>{{ chatbotModule.title }}</h3>
      <ToggleInput
        v-if="!chatbotModule.comingSoon"
        :value="chatbotModule.enabled"
        @input="chatbotModule.onToggleEnabled"
      />
    </div>
    <div
      class="chatbot-module__image"
      :style="{
        backgroundImage: `url(${chatbotModule.backgroundUrl})`
      }"
    />
    <div class="chatbot-module__body">
      <p>{{ chatbotModule.description }}</p>
      <div class="chatbot-module__action">
        <button
          v-if="!chatbotModule.comingSoon"
          @click="chatbotModule.onExpand"
          class="button button--default"
        >
          {{ $t('Preferences') }}
        </button>
        <button v-else disabled class="button button--default">
          {{ $t('Coming Soon') }}
        </button>
      </div>
    </div>
  </div>
</div>
</template>

<script lang='ts' src="./ChatbotModule.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";
.chatbot-module__container {
  display: inline-block;
  margin: 10px;
  width: 300px;
  .radius(2);
  background-color: var(--section-alt);

  &.chatbot-module__container--coming-soon {
    .chatbot-module__image {
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      background-color: var(--background);
      border-color: var(--section);
      border-width: 0 1px;
      border-style: solid;
    }
  }

  .chatbot-module__header {
    .flex();
    .flex--space-between();
    .flex--v-center();
    .padding--10();

    h3 {
      font-size: 16px;
      .margin--none();
      color: var(--title);
    }
  }

  .chatbot-module__image {
    height: 150px;
    width: 100%;
    background-size: cover;
  }

  .chatbot-module__body {
    .padding--10();
    color: var(--paragraph);
    height: 180px;
    .flex();
    .flex--column();
    .flex--space-between();

    .chatbot-module__action {
      .align-items--inline();
      .text-align--right();
    }
  }
}
</style>
