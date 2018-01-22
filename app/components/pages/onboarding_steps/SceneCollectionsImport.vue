<template>
<div>
  <div class="onboarding-step">
    <div class="onboarding-title">Scene Collections Import</div>
    <div class="onboarding-desc">Something something something</div>
    <button
      class="button button--action button--lg"
      @click="next">
      Continue
    </button>
  </div>
</div>
</template>

<script lang="ts" src="./ObsImport.vue.ts"></script>

<style lang="less" scoped>
label {
  text-align: left;
}

.importing-spinner {
  font-size: 32px;
}
</style>
