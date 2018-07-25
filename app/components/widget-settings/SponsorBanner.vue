<template>
<widget-window v-if="wData" ref="layout" v-model="tabName">

  <div slot="description">
    {{ $t('Set up a sponsor banner to be able to edit (add, remove, update) rotating sponsor logos on streamer channel.') }}
  </div>

  <div slot="settings" >
    <w-form-group :title="$t('Banner Width')">
      <w-slider-input v-model="wData.settings.banner_width" :metadata="{ max: 720, interval: 5 }" />
    </w-form-group>
    <w-form-group :title="$t('Banner Height')">
      <w-slider-input v-model="wData.settings.banner_height" :metadata="{ max: 720, interval: 5 }" />
    </w-form-group>
    <w-form-group :title="$t('Image Animation')">
      <w-animation-input v-model="wData.settings.show_animation" />
    </w-form-group>
    <w-form-group :title="$t('Background Color')">
      <w-bool-input v-model="wData.settings.background_color_option" :metadata="{ title: $t('Transparent') }" />
      <w-color-input v-if="!wData.settings.background_color_option" v-model="wData.settings.background_container_color" />
    </w-form-group>
    <w-form-group :title="$t('Placement')">
      <w-list-input v-model="wData.settings.placement_options" :metadata="{ options: placementOptions }" />
    </w-form-group>
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

<script lang="ts" src="./SponsorBanner.vue.ts"></script>
