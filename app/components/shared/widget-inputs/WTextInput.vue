<template>
  <input
      type="text"
      :placeholder="metadata.placeholder"
      :value="value"
      @input="emitInput($event.target.value)"
      v-validate="metadata.validate"
  />
</template>

<script lang="ts" src="./WTextInput.vue.ts"></script>
