<template>
  <textarea
      type="text"
      :placeholder="metadata.placeholder"
      :value="value"
      @input="emitInput($event.target.value)"
  />
</template>

<script lang="ts" src="./WTextAreaInput.vue.ts"></script>
