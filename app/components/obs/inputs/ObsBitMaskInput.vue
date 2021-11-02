<template>
  <h-form-group :title="value.showDescription !== false ? value.description : null">
    <div class="row bitmask-input">
      <bool-button-input
        v-for="(flag, index) in flags"
        :key="index"
        :value="flag"
        @input="value => onChangeHandler(index, !!value)"
        :title="index + 1"
        :metadata="{ disabled: value.enabled === false, name: `flag${index}` }"
      />
    </div>
  </h-form-group>
</template>

<script lang="ts" src="./ObsBitMaskInput.vue.ts"></script>

<style lang="less" scoped>
.row {
  margin-left: 0 !important;
  margin-bottom: 0;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-right: none;
}

.row > div {
  width: auto;
  margin-right: 4px;
  margin-bottom: 4px;
}
</style>
