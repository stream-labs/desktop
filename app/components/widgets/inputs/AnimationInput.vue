<template>
  <list-input
      :value="value"
      :metadata="listInputMetadata"
      @input="(value, event) => emitInput(value, event)"
  />
</template>

<script lang="ts" src="./AnimationInput.vue.ts"></script>
