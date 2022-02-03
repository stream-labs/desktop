<template>
<modal-layout
  :show-controls="false"
  :customControls="true">
  <div slot="content">
    <p class="optimize-title">{{ $t('streaming.optimizationForNiconico.description') }}</p>
    <ul class="optimize-category-list">
      <li class="optimize-category-list-item" v-for="category in settings.info" :key="category[0]">
        <p class="optimize-category-name">{{ $t(`settings.${category[0]}.name`, { fallback: category[0] }) }}</p>
        <ul class="optimize-setting-list">
          <li class="optimize-setting-list-item" v-for="o in category[1]" :key="o.key">
            <span class="item-name">{{ o.name }}: </span><span class="item-value">{{ o.currentValue }}
            <span class="item-new-value" v-if="o.newValue"> -&gt; {{ o.newValue }}</span></span>
          </li>
        </ul>
      </li>
    </ul>
    <BoolInput :value="useHardwareEncoder" @input="setUseHardwareEncoder" />
    <BoolInput :value="doNotShowAgain" @input="setDoNotShowAgain" />
  </div>
  <div slot="controls">
    <button
      class="button button--secondary"
      @click="skip">
      {{ $t('streaming.skipOptimization') }}
    </button>
    <button
      class="button button--primary"
      @click="optimizeAndGoLive">
      {{ $t('streaming.optimizeAndGoLive') }}
    </button>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./OptimizeForNiconico.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.input-container {
  flex-direction: column;
}
.optimize-title {
  color: var(--color-text-light);
}
.optimize-category-list {
  list-style: none;
  margin: 0;
}
.optimize-category-list-item {
  .radius;
  color: var(--color-text);
  margin-bottom: 16px;
  padding: 16px;
  list-style: none;
  background: var(--color-bg-secondary);
}
.optimize-category-name {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: var(--color-text-light);

  i {
    margin-right: 8px;
  }
}
.optimize-setting-list {
  list-style: none;
  margin: 0;
}
</style>
