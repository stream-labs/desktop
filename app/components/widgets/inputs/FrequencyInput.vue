<template>
  <list-input
      :value="value"
      :metadata="listInputMetadata"
      @input="(value, event) => emitInput(value, event)"
  />
</template>

<script lang="ts" src="./FrequencyInput.vue.ts"></script>
