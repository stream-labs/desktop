<template>
<div>
  <div class="studio-controls-top">
    <h4 class="studio-controls__label">
      Mixer
    </h4>
  </div>
  <div class="studio-controls-selector mixer-panel">
    <MixerItem v-for="audioSource in audioSources" :audioSource="audioSource" :key="audioSource.name"/>
  </div>
</div>
</template>

<script lang="ts" src="./Mixer.vue.ts"></script>
