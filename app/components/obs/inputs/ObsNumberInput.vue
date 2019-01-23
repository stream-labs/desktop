<template>
<h-form-group :title="value.description">
  <number-input :value="value.value" @input="val => updateValue(val)" :metadata="metadata" />
</h-form-group>
</template>

<script lang="ts" src="./ObsNumberInput.vue.ts"></script>
