<template>
<h-form-group>
  <div class="row">
    <bool-input
      v-for="(flag, index) in flags"
      :key="index"
      :value="flag"
      :disabled="value.enabled == false"
      @input="value => onChangeHandler(index, !!value)"
      :title="index + 1"
    />
  </div>
</h-form-group>
</template>

<script lang="ts" src="./ObsBitMaskInput.vue.ts"></script>

<style lang="less" scoped>
  .row {
    margin-bottom: 0;
    justify-content: flex-end;
  }

  .row > div {
    width: auto;
    margin-right: 15px;

    /deep/ .checkbox {
      margin-bottom: 0;
    }
  }
</style>
