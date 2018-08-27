<template>
<modal-layout
  :title="options.rename ? $t('Rename Source') : $t('Name Source')"
  :done-handler="submit">
  <form
    slot="content"
    @submit.prevent="submit">
    <p
      v-if="!error"
      class="NameSource-label">
      {{ $t('Please enter the name of the source') }}
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
.NameSource-label {
  margin-bottom: 10px;
}

.NameSource-label__error {
  color: red;
}
</style>
