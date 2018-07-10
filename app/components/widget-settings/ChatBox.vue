<template>
<widget-window v-if="wData" ref="layout" v-model="tabName">

  <div slot="description">
    {{ $t('Include your channel\'s chat into your stream, and make it look pretty while you\'re at it.') }}
  </div>

  <div slot="settings" >

    <w-form-group title="Theme" type="list" v-model="wData.settings.theme" :metadata="metadata.theme"/>

    <w-form-group title="Badges">
      <w-bool-input title="Show Moderator Badges" v-model="wData.settings.show_moderator_icons"/>
      <w-bool-input title="Show Subscriber Badges" v-model="wData.settings.show_subscriber_icons"/>
      <w-bool-input title="Show Turbo Badges" v-model="wData.settings.show_turbo_icons"/>
      <w-bool-input title="Show Twitch Prime Badges" v-model="wData.settings.show_premium_icons"/>
      <w-bool-input title="Show Bits Badges" v-model="wData.settings.show_bits_icons"/>
      <w-bool-input title="Show Top Coin Holder Badges" v-model="wData.settings.show_coin_icons"/>
    </w-form-group>

    <w-form-group title="Extra Emotes">
      <w-bool-input title="Enable BetterTTV Emotes" v-model="wData.settings.show_bttv_emotes"/>
      <w-bool-input title="Enable FrankerFaceZ Emotes" v-model="wData.settings.show_franker_emotes"/>
      <w-bool-input title="Enable Supermegafan Emotes" v-model="wData.settings.show_smf_emotes"/>
    </w-form-group>

    <w-form-group title="Background Color" type="color" v-model="wData.settings.background_color"/>
    <w-form-group title="Text Color" type="color" v-model="wData.settings.text_color" :metadata="{ tooltip: textColorTooltip }"/>
    <w-form-group title="Font Size" type="fontSize" v-model="wData.settings.text_size"/>

    <w-form-group title="Hide Message after">
      <w-bool-input title="Always Show Messages" v-model="wData.settings.always_show_messages"/>
      <w-slider-input v-model="wData.settings.message_hide_delay" :metadata="metadata.message_hide_delay"/>
    </w-form-group>

    <w-form-group title="Hide Characters">
      <w-bool-input title="Hide Common Chat Bots" v-model="wData.settings.hide_common_chat_bots"/>
      <w-bool-input title="Hide commands starting with `!`" v-model="wData.settings.hide_commands"/>
    </w-form-group>

    <w-form-group title="Muted Chatters" type="textArea" v-model="wData.settings.muted_chatters" />
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

<script lang="ts" src="./ChatBox.vue.ts"></script>
