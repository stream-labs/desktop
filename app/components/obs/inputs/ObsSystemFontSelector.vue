<template>
  <div>
    <div class="input-container">
      <div class="input-label">
        <label>{{$t('Font Family')}}</label>
      </div>
      <div class="input-wrapper">
        <list-input :value="value.value.face" :metadata="familyMetadata" @input="setFamily" />
      </div>
    </div>
    <div class="input-container">
      <div class="input-label">
        <label>{{$t('Font Style')}}</label>
      </div>
      <div class="input-wrapper">
        <list-input :value="value.value.style" :metadata="styleMetadata" @input="setStyle" />
      </div>
    </div>
    <font-size-selector :value="value.value.size" @input="setSize" />
  </div>
</template>

<script lang="ts" src="./ObsSystemFontSelector.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.multiselect--font {
  margin-bottom: 0;
}

.FontProperty-presets {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  border: 0;
  background-color: rgba(0,0,0,0);
  cursor: pointer;
  outline: none;
}
</style>
