<template>
  <input
      type="text"
      :placeholder="metadata.placeholder"
      :value="value"
      @input="emitInput($event.target.value)"
      required
      :maxlength="metadata.maxlength"
  />
</template>

<script lang="ts" src="./WTextInput.vue.ts"></script>
