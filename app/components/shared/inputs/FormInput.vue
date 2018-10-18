<template>
  <component
    v-if="options.type"
    :is="componentName"
    :value="value"
    @input="(value, event) => emitInput(value, event)"
    :metadata="options"
  />
</template>

<script lang="ts" src="./FormInput.vue.ts"></script>
