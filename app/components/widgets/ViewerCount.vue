<template>
<widget-editor :navItems="navItems">
    <validated-form slot="manage-count-properties" @input="save()" v-if="loaded">
      <v-form-group title="Enabled Streams">
        <bool-input title="Twitch Viewers" v-model="wData.settings.twitch "/>
        <bool-input title="Youtube Viewers" v-model="wData.settings.youtube"/>
        <bool-input title="Mixer Viewers" v-model="wData.settings.mixer"/>
      </v-form-group>
      <v-form-group title="Background Color" type="color" v-model="wData.settings.background_color" />
    </validated-form>

    <validated-form slot="font-properties" @input="save()" v-if="loaded">
      <v-form-group title="Font" type="fontFamily" v-model="wData.settings.font" :metadata="{ tooltip: fontFamilyTooltip }"/>
      <v-form-group title="Text Color" type="color" v-model="wData.settings.font_color"/>
      <v-form-group title="Font Size" type="fontSize" v-model="wData.settings.font_size" :metadata="{ min: 10, max: 100 }" />
    </validated-form>
  </widget-editor>
</template>

<script lang="ts" src="./ViewerCount.vue.ts"></script>
