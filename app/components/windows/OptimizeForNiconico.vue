<template>
<modal-layout
  :title="$t('streaming.optimizationForNiconico.title')"
  :show-controls="false"
  :customControls="true">
  <div slot="content">

    <p class="optimize-title">{{ $t('streaming.optimizationForNiconico.description') }}</p>
    <ul class="optimize-category-list">
      <li class="optimize-category-list-item" v-for="category in settings.info" :key="category[0]">
        <p class="optimize-category-name"><i :class="icons[category[0]]" />{{ $t(`settings.${category[0]}.name`, { fallback: category[0] }) }}</p>
        <ul class="optimize-setting-list">
          <li class="optimize-setting-list-item" v-for="o in category[1]" :key="o.key">
            <span class="item-name">{{ o.name }}: </span><span class="item-value">{{ o.currentValue }}
            <span class="item-new-value" v-if="o.newValue"> -&gt; {{ o.newValue }}</span></span>
          </li>
        </ul>
      </li>
    </ul>
    <BoolInput :value="doNotShowAgain" @input="setDoNotShowAgain" />
  </div>
  <div slot="controls">
    <button
      class="button button--default"
      @click="skip">
      {{ $t('streaming.skipOptimization') }}
    </button>
    <button
      class="button button--action"
      @click="optimizeAndGoLive">
      {{ $t('streaming.optimizeAndGoLive') }}
    </button>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./OptimizeForNiconico.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

.input-container {
  flex-direction: column;
}
.optimize-category-list {
  list-style: none;
  margin: 0;
}
.optimize-category-list-item {
  margin-bottom: 12px;
  list-style: none;
}
.optimize-category-name {
  margin-bottom: 4px;

  i {
    margin-right: 8px;
  }
}
.optimize-setting-list {
  list-style: none;
  background: @bg-tertiary;
  .radius;
  margin: 0;
  padding: 8px;
}
</style>
