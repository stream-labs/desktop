<template>
<widget-window v-if="wData" ref="layout" v-model="tabName">

  <div slot="description">
    {{ $t('Set up a sponsor banner to be able to edit (add, remove, update) rotating sponsor logos on streamer channel.') }}
  </div>

  <div slot="settings" >
    {{ JSON.stringify(wData) }}
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
