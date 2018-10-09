<template>
<modal-layout
  :title="$t('streaming.optimizationForNiconico.title')"
  :show-controls="false"
  :customControls="true">
  <div slot="content">

    {{ $t('streaming.optimizationForNiconico.description') }}
    <ul>
      <li v-for="category in settings.info" :key="category[0]">
        {{ $t(`settings.${category[0]}.name`, { fallback: category[0] }) }}
        <ul>
          <li v-for="o in category[1]" :key="o.key">
            {{ o.name }}: {{ o.currentValue }}
            <span v-if="o.newValue"> -&gt; {{ o.newValue }}</span>
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
.input-container {
  margin-top: 12px;
  flex-direction: column;
}
</style>