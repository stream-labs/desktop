<template>
  <slider-input
    data-role="input"
    data-type="fontSize"
    :data-name="options.name"
    :metadata="sliderOptions"
    :value="sliderValue"
    @input="value => updateValue(value)"
  />
</template>

<script lang="ts" src="./FontSize.vue.ts"></script>
