<template>
<div class="container">
  <list-input
    :value="value"
    :metadata="listInputMetadata"
    @input="(value, event) => emitInput(value, event)"
  />
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
