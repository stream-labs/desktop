<template>
<div class="google-font-selector">
  <div>
    <div class="input-container">
      <div class="input-label">
        <label>
          {{ $t('Font Family') }}
          <i v-if="isLoading" class="fa fa-spinner fa-pulse google-font-loading" />
        </label>
      </div>
      <div class="input-wrapper">
        <multiselect
          :value="selectedFamily"
          :options="fontFamilies"
          :disabled="isLoading"
          @input="setFamily">
        </multiselect>
      </div>
    </div>
    <div class="input-container">
      <div class="input-label">
        <label>
          {{ $t('Font Style') }}
          <i v-if="isLoading" class="fa fa-spinner fa-pulse google-font-loading" />
        </label>
      </div>
      <div class="input-wrapper">
        <multiselect
          :value="selectedStyle"
          :options="fontStyles"
          :allow-empty="false"
          :disabled="isLoading"
          @input="setStyle">
        </multiselect>
      </div>
    </div>
    <font-size-selector :value="value.size" @input="setSize" />
  </div>
</div>
</template>

<script lang="ts" src="./ObsGoogleFontSelector.vue.ts"></script>

<style lang="less" scoped>
.google-font-loading {
  margin-left: 5px;
}
</style>
