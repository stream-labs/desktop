<template>
  <div>
    <div class="section">
      <div class="section-content">
        <GenericForm v-model="settingsFormData" @input="saveSettings" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./ExperimentalSettings.vue.ts"></script>

