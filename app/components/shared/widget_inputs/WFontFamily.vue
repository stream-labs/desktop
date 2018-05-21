<template>
<div class="google-font-selector">
  <label>
    {{ value.description }}
  </label>

  <multiselect
    :value="value"
    :options="fonts">
  </multiselect>
</div>
</template>

<script lang="ts" src="./WFontFamily.vue.ts"></script>
