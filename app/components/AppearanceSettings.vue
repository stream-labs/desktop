<template>
  <div>
    <div class="section">
      <button class="button button--sm button--soft-warning" @click="restoreDefaults">
        Restore Defaults
      </button>
    </div>
    <div class="section">
      <GenericForm v-model="settingsFormData" @input="saveSettings" />
    </div>
  </div>
</template>

<script lang="ts" src="./AppearanceSettings.vue.ts"></script>

