<template>
  <widget-editor
    :navItems="navItems"
    :isAlertBox="true"
  >
    <div slot="leftbar">
      <div>{{ $t('Add Alert') }}</div>
      <div @click="selectAlert('general')">{{ $t('General Settings') }}</div>
      <div
        v-for="alert in alertTypes"
        :key="alert"
        @click="selectAlert('alert')"
      >

      </div>
    </div>
  </widget-editor>
</template>

<script lang="ts" src="./AlertBox.vue.ts"></script>
