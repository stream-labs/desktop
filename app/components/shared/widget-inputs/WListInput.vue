<template>
<div>
  <label>{{ title }}</label>
  <multiselect
    :value="currentValue"
    :options="metadata.options"
    track-by="value"
    :close-on-select="true"
    :placeholder="placeholder"
    label="description"
    @input="onInputHandler">
  </multiselect>
</div>
</template>

<script lang="ts" src="./WListInput.vue.ts"></script>
