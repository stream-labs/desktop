<template>
  <div>
    <div class="section">
      <button class="button button--action button--sm" @click="showNotifications">
        Show Notifications
      </button>
      <button class="button button--sm button--soft-warning" @click="restoreDefaults">
        Restore Defaults
      </button>
    </div>
    <div class="section">
      <GenericForm v-model="settingsFormData" @input="saveNotificationsSettings" />
    </div>
    <div class="section">
      <h4>
        Troubleshooter Notifications
      </h4>

      <GenericForm v-model="troubleshooterFormData"  @input="saveTroubleshooterSettings"/>
    </div>
  </div>
</template>

<script lang="ts" src="./NotificationsSettings.vue.ts"></script>

