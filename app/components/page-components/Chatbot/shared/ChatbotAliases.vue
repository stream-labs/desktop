<template>
<div class="chatbot-aliases__container">
  <label for="alias" class="margin-vertical--10">Enter Aliases</label>
  <div class="row">
    <div class="small-9 columns">
      <TextInput
        v-model="newAlias"
        :metadata="textInputMetadata"
        class="width--100"
      />
    </div>
    <div class="small-3 columns">
      <button
        class="chatbot-aliases__new-alias__button"
        @click="onAddAlias"
      >
        Add Alias
      </button>
    </div>
  </div>
  <div class="align-items--inline">
    <div
      v-for="alias in value"
      :key="alias"
      class="chatbot-aliases__alias"
      @click="onDeleteAlias(alias)"
    >
      <i class="chatbot-aliases__alias__close-icon icon-close"></i>
      {{ alias }}
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./ChatbotAliases.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";
.chatbot-aliases__container {

  .chatbot-aliases__new-alias__button {
    .button();
    .text-transform--capitalize();
    .width--100();
  }
  .chatbot-aliases__alias {
    margin-right: 10px;
    padding: 6px 12px;
    background-color: @teal;
    border-radius: 20px;
    color: white;
    cursor: pointer;

    .chatbot-aliases__alias__close-icon {
      margin-right: 4px;
      font-size: 10px;
    }
  }
}
</style>
