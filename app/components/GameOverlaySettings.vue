<template>
  <div>
    <div class="section">
      <div class="section-content">
        <bool-input v-model="enableGameOverlay" :title="$t('Enable in-game overlay')" />
        <bool-input v-model="enablePreview" :title="$t('Enable stream preview in overlay')" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./GameOverlaySettings.vue.ts"></script>
