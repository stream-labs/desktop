<template>
  <div>
    <div class="section">
      <button class="button button--action button--sm" @click="showNotifications">
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

