<template>
<widget-window v-if="wData" ref="layout" v-model="tabName">

  <div slot="description">
    {{ $t('Include your channel\'s chat into your stream, and make it look pretty while you\'re at it.') }}
  </div>

  <div slot="settings">
    <w-form-group title="Enabled Events">
      <w-bool-input title="Tips &amp; Donations" v-model="wData.settings.show_moderator_icons"/>
      <w-bool-input title="Twitch Follows" v-model="wData.settings.show_subscriber_icons"/>
      <w-bool-input title="Twitch Bits/Cheers" v-model="wData.settings.show_turbo_icons"/>
      <w-bool-input title="Twitch Subs" v-model="wData.settings.show_premium_icons"/>
      <w-bool-input title="Twitch Resubs" v-model="wData.settings.show_bits_icons"/>
    </w-form-group>
  </div>
</widget-window>
</template>

<script lang="ts" src="./TipJar.vue.ts"></script>
