<template>
  <h-form-group :title="value.showDescription !== false ? value.description : undefined">
    <slider-input :metadata="metadata" :value="value.value" @input="value => updateValue(value)" />
  </h-form-group>
</template>

<script lang="ts" src="./ObsSliderInput.vue.ts"></script>
