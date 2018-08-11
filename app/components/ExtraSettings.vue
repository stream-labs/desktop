<template>
<div>
  <div class="section" v-if="isNiconicoLoggedIn()">
    <div class="input-label">
      <label>{{ $t('settings.optimizationForNiconicoLiveService')}}</label>
    </div>
    <BoolInput
      :value="optimizeForNiconicoModel"
      @input="setOptimizeForNiconico" />
    <BoolInput
      :value="showOptimizationDialogForNiconicoModel"
      v-show="optimizeForNiconicoModel.value"
      @input="setShowOptimizationDialogForNiconico"
      class="optional-item" />
  </div>

  <div class="section">
    <div class="input-label">
      <label>{{ $t('settings.cacheManagement')}}</label>
    </div>

    <p>{{ $t('settings.cacheClearDescription')}}</p>

    <a class="button button--action" @click="showCacheDir">
      {{ $t('settings.showCacheDirectory')}}
    </a>

    <a class="button button--action" @click="deleteCacheDir">
      {{ $t('settings.deleteCacheAndRestart') }}
    </a>
  </div>
</div>
</template>

<script lang="ts" src="./ExtraSettings.vue.ts"></script>

<style lang="less" scoped>
.optional-item {
  margin-left: 24px;
}
</style>