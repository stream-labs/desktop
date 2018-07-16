<template>
  <div>
    <w-slider-input :metadata="{min: 8, max: 144}" :value="sliderValue" @input="value => updateValue(value)"/>
  </div>
</template>

<script lang="ts" src="./WFontSize.vue.ts"></script>
