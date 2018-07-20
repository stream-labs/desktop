<template>
  <w-list-input
      :value="value"
      :metadata="listInputMetadata"
      @input="value => emitInput(value)"
  />
</template>

<script lang="ts" src="./WAnimationInput.vue.ts"></script>
