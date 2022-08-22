<template>
<modal-layout :done-handler="submit">
  <form
    slot="content"
    @submit.prevent="submit">
    <p
      v-if="!error"
      class="NameScene-label">
      {{ $t('scenes.enterTheNameOfTheScene') }}
    </p>
    <p
      v-if="error"
      class="NameScene-label NameScene-label__error">
      {{ error }}
    </p>
    <input
      autofocus
      type="text"
      v-model="name"/>
  </form>
</modal-layout>
</template>

<script lang="ts" src="./NameScene.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.NameScene-label {
  color: var(--color-text);
  margin-bottom: 8px;
}

.NameScene-label__error {
  color: var(--color-error);
}
</style>
