<template>
<div class="input-container select">
  <div class="input-label">
    <label>Information</label>
  </div>
  <div class="input-wrapper">
    <multiselect
      :options="statOptions"
      group-label="label"
      group-values="files"
      track-by="name"
      label="label"
      :value="currentlySelected"
      @input="handleInput"/>
  </div>
</div>
</template>

<script lang="ts" src="./StreamlabelProperties.vue.ts"></script>
