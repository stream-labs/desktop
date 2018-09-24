<template>
  <widget-window :requestState="requestState" :loaded="loaded" ref="layout" v-model="tabName">
    <div slot="settings" v-if="loaded">

      <h-form-group title="Background Color" type="color" v-model="wData.settings.background_color" />

      <h-form-group title="Enabled Streams">
        <bool-input title="Twitch Viewers" v-model="wData.settings.twitch "/>
        <bool-input title="Youtube Viewers" v-model="wData.settings.youtube"/>
        <bool-input title="Mixer Viewers" v-model="wData.settings.mixer"/>
      </h-form-group>

      <h-form-group title="Font" type="fontFamily" v-model="wData.settings.font" :metadata="{ tooltip: fontFamilyTooltip }"/>
      <h-form-group title="Text Color" type="color" v-model="wData.settings.font_color"/>
      <h-form-group title="Font Size" type="fontSize" v-model="wData.settings.font_size"/>

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
  </widget-window>
</template>

<script lang="ts" src="./ViewerCount.vue.ts"></script>
