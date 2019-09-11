<template>
<modal-layout :done-handler="submit">
  <form
    slot="content"
    @submit.prevent="submit">
    <p
      v-if="!error"
      class="NameScene-label">
      {{ $t('Please enter the name of the Scenes Collection') }}
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

<script lang="ts" src="./NameSceneCollection.vue.ts"></script>

<style lang="less" scoped>
.NameScene-label {
  margin-bottom: 10px;
}

.NameScene-label__error {
  color: red;
}
</style>
