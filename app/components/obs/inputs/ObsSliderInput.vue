<template>
  <input-wrapper :value="value.value" @input="value => updateValue(value)" :metadata="metadata" />
</template>

<script lang="ts" src="./ObsSliderInput.vue.ts"></script>
