<template>
<widget-layout v-if="wData" v-model="tabName">


  <div slot="settings" >
    <w-form-group title="Theme" type="list" v-model="wData.settings.theme" :metadata="metadata.theme"/>
    <w-form-group title="Badges">
      <w-bool-input title="Show Moderator Badges" v-model="wData.settings.show_moderator_icons"/>
      <w-bool-input title="Show Subscriber Badges" v-model="wData.settings.show_subscriber_icons"/>
    </w-form-group>
  </div>

</widget-layout>

</template>

<script lang="ts" src="./ChatBox.vue.ts"></script>
