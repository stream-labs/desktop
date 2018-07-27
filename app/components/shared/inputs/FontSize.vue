<template>
  <div>
    <slider-input :metadata="sliderOptions" :value="sliderValue" @input="value => updateValue(value)"/>
  </div>
</template>

<script lang="ts" src="./FontSize.vue.ts"></script>
