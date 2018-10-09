<template>
<div @contextmenu="handleRightClick">
  <div class="studio-controls-top">
    <h2
      class="studio-controls__label"
      v-tooltip.bottom="mixerTooltip">
      {{ $t('Mixer') }}
    </h2>
    <div>
      <i
        class="icon-settings icon-button"
        @click="showAdvancedSettings()"
        v-tooltip.left="advancedSettingsTooltip"/>
    </div>
  </div>
  <div class="selector-list mixer-panel">
    <MixerItem v-for="audioSource in audioSources" :audioSource="audioSource" :key="audioSource.sourceId"/>
  </div>
</div>
</template>

<script lang="ts" src="./Mixer.vue.ts"></script>
