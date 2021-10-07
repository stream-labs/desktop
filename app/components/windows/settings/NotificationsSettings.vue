<template>
  <div>
    <div class="section">
      <button class="button button--action" @click="showNotifications">
        {{ $t('Show Notifications') }}
      </button>
      <button class="button button--soft-warning" @click="restoreDefaults">
        {{ $t('Restore Defaults') }}
      </button>
    </div>
    <div class="section">
      <div class="section-content">
        <GenericForm v-model="settingsFormData" @input="saveNotificationsSettings" />
      </div>
    </div>
    <div class="section">
      <div class="section-content">
        <h2>
          {{ $t('Troubleshooter Notifications') }}
        </h2>
        <GenericForm v-model="troubleshooterFormData"  @input="saveTroubleshooterSettings"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./NotificationsSettings.vue.ts"></script>

