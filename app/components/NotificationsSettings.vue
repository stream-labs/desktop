<template>
  <div>
    <div class="section">
      <button class="button button--action" @click="showNotifications">
        Show Notifications
      </button>
    </div>
    <div class="section">
      <GenericForm
          v-model="settingsFormData"
          @input="save" />
      </div>
  </div>
</template>

<script lang="ts" src="./NotificationsSettings.vue.ts"></script>

