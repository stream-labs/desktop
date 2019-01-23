<template>
<multiselect
  :options="options.options"
  group-label="label"
  group-values="options"
  track-by="value"
  label="label"
  :allow-empty="false"
  :value="displayValue"
  @input="(option) => emitInput(option.value)"/>
</template>

<script lang="ts" src="./SectionedMultiselectInput.vue.ts"></script>
