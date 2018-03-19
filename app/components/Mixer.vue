<template>
<div>
  <div class="studio-controls-top">
    <h4 class="studio-controls__label">
      Mixer
    </h4>
    <div>
      <i
        class="fa fa-cog icon-btn"
        @click="showAdvancedSettings()"
        v-tooltip.left="advancedSettingsTooltip"/>
    </div>
  </div>
  <div class="studio-controls-selector mixer-panel">
    <MixerItem v-for="audioSource in audioSources" :audioSource="audioSource" :key="audioSource.sourceId"/>
  </div>
</div>
</template>

<script lang="ts" src="./Mixer.vue.ts"></script>
