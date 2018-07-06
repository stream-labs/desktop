<template>
<div class="container">
  <div class="google-font-selector input-wrapper">
    <multiselect
      :value="value"
      :options="fonts">
    </multiselect>
  </div>
  <div class="w-tooltip">
    <i class="icon-question icon-btn" v-tooltip="tooltipText" />
  </div>
</div>
</template>

<script lang="ts" src="./WFontFamilyInput.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.container {
  position: relative;
}

.google-font-selector {
  width: 220px;
}
</style>
