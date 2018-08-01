<template>
  <div>
    <slider-input
      :metadata="sliderMetadata"
      :value="sliderValue"
      @input="value => updateValue(value)"
    />
  </div>
</template>

<script lang="ts" src="./FontSize.vue.ts"></script>
