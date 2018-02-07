<template>
  <div>
    <div class="section">
      <GenericForm v-model="settingsFormData" @input="saveSettings" />
    </div>
  </div>
</template>

<script lang="ts" src="./AppearanceSettings.vue.ts"></script>

