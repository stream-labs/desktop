<template>
<div class="container">
  <div class="google-font-selector input-wrapper">
    <multiselect
      :value="value"
      :options="fonts">
    </multiselect>
  </div>
</div>
</template>

<script lang="ts" src="./FontFamilyInput.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.container {
  position: relative;
  display: flex;
  align-items: center;
}

.google-font-selector {
  width: 220px;
}
</style>
