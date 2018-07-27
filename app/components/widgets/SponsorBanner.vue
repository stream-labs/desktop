<template>
<widget-window v-if="wData" ref="layout" v-model="tabName">

  <div slot="description">
    {{ $t('Set up a sponsor banner to be able to edit (add, remove, update) rotating sponsor logos on streamer channel.') }}
  </div>

  <div slot="settings" >
    <form-group :title="$t('Banner Width')">
      <slider-input v-model="wData.settings.banner_width" :metadata="{ max: 720, interval: 5 }" />
    </form-group>
    <form-group :title="$t('Banner Height')">
      <slider-input v-model="wData.settings.banner_height" :metadata="{ max: 720, interval: 5 }" />
    </form-group>
    <form-group :title="$t('Image Animation')">
      <animation-input v-model="wData.settings.show_animation" />
    </form-group>
    <form-group :title="$t('Background Color')">
      <bool-input v-model="wData.settings.background_color_option" :metadata="{ title: $t('Transparent') }" />
      <color-input v-if="!wData.settings.background_color_option" v-model="wData.settings.background_container_color" />
    </form-group>
    <form-group :title="$t('Placement')">
      <list-input v-model="wData.settings.placement_options" :metadata="{ options: placementOptions }" />
    </form-group>
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

<script lang="ts" src="./SponsorBanner.vue.ts"></script>
