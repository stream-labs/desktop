<template>
<div>
  <vue-timepicker
    :value="value"
    @input="emitInput($event)"
    :format="metadata.format"
    :minute-interval="metadata.minuteInterval"
    :second-interval="metadata.secondInterval"
    :hide-clear-button="metadata.hideClearButton"
  >
  </vue-timepicker>
</div>
</template>

<script lang="ts" src="./TimePickerInput.vue.ts"></script>