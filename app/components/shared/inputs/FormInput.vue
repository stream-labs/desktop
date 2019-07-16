<template>
  <component
    v-if="options.type"
    :is="componentName"
    :value="value"
    @input="value => $emit('input', value)"
    :metadata="options"
  />
</template>

<script lang="ts" src="./FormInput.vue.ts"></script>
