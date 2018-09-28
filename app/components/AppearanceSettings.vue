<template>
  <div>
    <div class="section">
      <div class="section-content">
        <GenericForm v-model="settingsFormData" @input="saveSettings" />
      </div>
    </div>
    <div v-if="enableFFZEmotes" class="section">
      <button class="button button--action" @click="openFFZSettings">
        {{ $t('Open FrankerFaceZ Settings') }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" src="./AppearanceSettings.vue.ts"></script>

