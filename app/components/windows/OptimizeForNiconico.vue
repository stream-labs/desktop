<template>
<modal-layout
  :title="$t('streaming.optimizationForNiconico.title')"
  :show-controls="false"
  :customControls="true">
  <div slot="content">

    {{ $t('streaming.optimizationForNiconico.description') }}
    <ul>
      <li>
        {{ $t('settings.Output.Streaming.VBitrate.name') }}: {{ settings.currentVideoBitrate }}
        <span v-if="settings.optimizedVideoBitrate"> -&gt; {{ settings.optimizedVideoBitrate }}</span>
      </li>
      <li>
        {{ $t('settings.Output.Streaming.ABitrate.name') }}: {{ settings.currentAudioBitrate }}
        <span v-if="settings.optimizedAudioBitrate"> -&gt; {{ settings.optimizedAudioBitrate }}</span>
      </li>
      <li>
        {{ $t('settings.Output.name') }}: {{ qualityName(settings.currentQuality) }}
        <span v-if="settings.optimizedQuality"> -&gt; {{ qualityName(settings.optimizedQuality) }}</span>
      </li>
      <li>
        {{ $t('settings.Advanced.Video.ColorSpace.name') }}: {{ settings.currentColorSpace }}
        <span v-if="settings.optimizedColorSpace"> -&gt; {{ settings.optimizedColorSpace }}</span>
      </li>
      <li>
        {{ $t('streaming.FPS') }}: {{ settings.currentFps }}
        <span v-if="settings.optimizedFps"> -&gt; {{ settings.optimizedFps }}</span>
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