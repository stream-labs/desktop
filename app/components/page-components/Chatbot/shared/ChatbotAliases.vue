<template>
<form
  class="chatbot-aliases__container"
  @submit.prevent="onAddAliasHandler"
>
  <div class="margin-vertical--10"> {{ $t('Enter Aliases') }} </div>
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
        type="submit"
        :disabled="!newAlias || isDuplicate || containsSpaces"
        class="chatbot-aliases__new-alias__button button button--default"
      >
        {{ $t('Add Alias') }}
      </button>
    </div>
  </div>
  <div class="margin-vertical--10">
    <i v-if="isDuplicate" > {{ $t('Cannot add duplicate aliases. Please add something else.') }} </i>
    <i v-else-if="containsSpaces" > {{ $t('Alias cannot contain spaces.') }} </i>
    <i v-else> {{ $t('An alternative text string to trigger your command') }} </i>
  </div>

  <div class="chatbot-aliases__aliases_wrapper">
    <div
      v-for="(alias, index) in value"
      :key="`${alias}__${index}`"
      class="chatbot-aliases__alias"
      @click="onDeleteAliasHandler(alias)"
    >
      <i class="chatbot-aliases__alias__close-icon icon-close"></i>
      {{ alias }}
    </div>
  </div>
</form>
</template>

<script lang="ts" src="./ChatbotAliases.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";
.chatbot-aliases__container {
  .chatbot-aliases__new-alias__button {
    .text-transform();
    .width--100();
  }

  .chatbot-aliases__aliases_wrapper {
    .align-items--inline;
    .margin-top();
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
