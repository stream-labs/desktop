<template>
<widget-editor
  v-if="wData"
  ref="layout"
  :requestState="requestState"
  :loaded="loaded"
  v-model="wData.settings.custom_enabled"
  :settings="settings"
>
    <div slot="manage-count-properties">
      <v-form-group title="Enabled Streams">
        <bool-input title="Twitch Viewers" v-model="wData.settings.twitch "/>
        <bool-input title="Youtube Viewers" v-model="wData.settings.youtube"/>
        <bool-input title="Mixer Viewers" v-model="wData.settings.mixer"/>
      </v-form-group>
      <v-form-group title="Background Color" type="color" v-model="wData.settings.background_color" />
    </div>

    <div slot="font-properties">
      <v-form-group title="Font" type="fontFamily" v-model="wData.settings.font" :metadata="{ tooltip: fontFamilyTooltip }"/>
      <v-form-group title="Text Color" type="color" v-model="wData.settings.font_color"/>
      <v-form-group title="Font Size" type="fontSize" v-model="wData.settings.font_size"/>
    </div>

    <div slot="HTML" >
      <code-editor v-model="wData" :metadata="{ type: 'html' }"/>
    </div>

    <div slot="CSS" >
      <code-editor v-model="wData" :metadata="{ type: 'css' }"/>
    </div>

    <div slot="JS" >
      <code-editor v-model="wData" :metadata="{ type: 'js' }"/>
    </div>
  </widget-editor>
</template>

<script lang="ts" src="./ViewerCount.vue.ts"></script>
