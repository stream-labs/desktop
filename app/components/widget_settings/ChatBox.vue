<template>
<widget-layout v-if="data" v-model="tabName">


  <div slot="settings" >
    <w-form-group title="Theme" type="list" v-model="data.settings.theme" :metadata="metadata.theme"/>
    <w-form-group title="Badges">
      <w-bool-input title="Show Moderator Badges" v-model="data.settings.show_moderator_icons"/>
      <w-bool-input title="Show Subscriber Badges" v-model="data.settings.show_subscriber_icons"/>
    </w-form-group>
  </div>

</widget-layout>

</template>

<script lang="ts" src="./ChatBox.vue.ts"></script>
