<template>
  <input
      type="number"
      :placeholder="metadata.placeholder"
      :value="value"
      @input="emitInput($event.target.value)"
      :required="required"
      :max="metadata.max"
      :min="metadata.min"
  />
</template>

<script lang="ts" src="./WNumberInput.vue.ts"></script>
