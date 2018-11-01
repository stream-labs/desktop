<template>
<multiselect
  :options="options.options"
  group-label="label"
  group-values="options"
  track-by="value"
  label="label"
  :allow-empty="false"
  :value="value"
  @input="emitInput"/>
</template>

<script lang="ts" src="./SectionedMultiselectInput.vue.ts"></script>
