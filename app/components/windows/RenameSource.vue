<template>
<modal-layout :done-handler="submit">
  <form
    slot="content"
    @submit.prevent="submit">
    <p
      v-if="!error"
      class="NameSource-label">
      {{ $t('sources.enterTheNameOfSource') }}
    </p>
    <p
      v-if="error"
      class="NameSource-label NameSource-label__error">
      {{ error }}
    </p>
    <input
      autofocus
      type="text"
      v-model="name"/>
  </form>
</modal-layout>
</template>

<script lang="ts" src="./RenameSource.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.NameSource-label {
  color: var(--color-text);
  margin-bottom: 8px;
}

.NameSource-label__error {
  color: var(--color-error);
}
</style>
