<template>
<h-form-group :title="value.showDescription !== false ? value.description : null">
  <div class="row bitmask-input">
    <bool-input
      v-for="(flag, index) in flags"
      :key="index"
      :value="flag"
      @input="value => onChangeHandler(index, !!value)"
      :title="index + 1"
      :metadata="{ disabled: this.enabled === false }"
    />
  </div>
</h-form-group>
</template>

<script lang="ts" src="./ObsBitMaskInput.vue.ts"></script>

<style lang="less" scoped>
  .row {
    margin-bottom: 0;
    justify-content: flex-start;
  }

  .row > div {
    width: auto;
    margin-right: 15px;

    /deep/ .checkbox {
      margin-bottom: 0;
    }
  }
</style>
