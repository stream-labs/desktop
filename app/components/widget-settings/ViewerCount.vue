<template>
  <widget-window v-if="wData" ref="layout" v-model="tabName">

    <div slot="description">
      {{ $t('Show the number of viewers watching.') }}
    </div>

    <div slot="settings">


      <w-form-group title="Background Color" type="color" v-model="wData.settings.background_color" />

      <w-form-group title="Enabled Streams">
        <w-bool-input title="Twitch Viewers" v-model="wData.settings.twitch "/>
        <w-bool-input title="Youtube Viewers" v-model="wData.settings.youtube"/>
        <w-bool-input title="Mixer Viewers" v-model="wData.settings.mixer"/>
      </w-form-group>


      <w-form-group title="Font" type="fontFamily" v-model="wData.settings.font"/>
      <w-form-group title="Text Color" type="color" v-model="wData.settings.font_color"/>
      <w-form-group title="Font Size" type="fontSize" v-model="wData.settings.font_size"/>

    </div>


    <div slot="HTML" >
      <w-code-editor v-model="wData" :metadata="{ type: 'html' }"/>
    </div>

    <div slot="CSS" >
      <w-code-editor v-model="wData" :metadata="{ type: 'css' }"/>
    </div>

    <div slot="JS" >
      <w-code-editor v-model="wData" :metadata="{ type: 'js' }"/>
    </div>


  </widget-window>

</template>

<script lang="ts" src="./ViewerCount.vue.ts"></script>
