<template>
<div>
  <div class="chatbot-module__container">
    <div class="chatbot-module__header">
      <h3>{{ chatbotModule.title }}</h3>
      <ToggleInput
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
      <br />
      <br />
      <div class="chatbot-module__action">
        <button
          @click="chatbotModule.onExpand"
          class="button button--action"
        >
          Preferences
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
  .radius();
  background-color: @day-secondary;

  .chatbot-module__header {
    .flex();
    .flex--space-between();
    .flex--v-center();
    .padding--10();

    h3 {
      font-size: 16px;
      .margin--none();
    }
  }

  .chatbot-module__image {
    height: 150px;
    width: 100%;
    background-size: cover;
  }

  .chatbot-module__body {
    .padding--10();
    color: @day-paragraph;

    .chatbot-module__action {
      .align-items--inline;
      .text-align--right;
    }
  }
}


.night-theme {
  .chatbot-module__container {
    background-color: @night-accent-light;

    h3, p {
      color: white;
    }

    .chatbot-module__body {
      color: @night-paragraph;
    }
  }
}
</style>
