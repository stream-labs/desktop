<template>
<widget-editor :navItems="navItems">

  <validated-form slot="visual-properties" v-if="loaded" @input="save()">
    <v-form-group title="Theme" type="list" v-model="wData.settings.theme" :metadata="metadata.theme"/>
    <v-form-group title="Badges">
      <bool-input title="Show Moderator Badges" v-model="wData.settings.show_moderator_icons"/>
      <bool-input title="Show Subscriber Badges" v-model="wData.settings.show_subscriber_icons"/>
      <bool-input title="Show Turbo Badges" v-model="wData.settings.show_turbo_icons"/>
      <bool-input title="Show Twitch Prime Badges" v-model="wData.settings.show_premium_icons"/>
      <bool-input title="Show Bits Badges" v-model="wData.settings.show_bits_icons"/>
      <bool-input title="Show Top Coin Holder Badges" v-model="wData.settings.show_coin_icons"/>
    </v-form-group>
    <v-form-group title="Extra Emotes">
      <bool-input title="Enable BetterTTV Emotes" v-model="wData.settings.show_bttv_emotes"/>
      <bool-input title="Enable FrankerFaceZ Emotes" v-model="wData.settings.show_franker_emotes"/>
      <bool-input title="Enable Supermegafan Emotes" v-model="wData.settings.show_smf_emotes"/>
    </v-form-group>
    <v-form-group title="Background Color" type="color" v-model="wData.settings.background_color" :metadata="{ tooltip: backgroundColorTooltip, description: backgroundColorDescription }" />
    <v-form-group title="Hide Message after">
      <bool-input title="Always Show Messages" v-model="wData.settings.always_show_messages"/>
      <slider-input v-model="wData.settings.message_hide_delay" :metadata="metadata.message_hide_delay"/>
    </v-form-group>
  </validated-form>

  <validated-form slot="font-properties" v-if="loaded" @input="save()">
    <v-form-group title="Text Color" type="color" v-model="wData.settings.text_color" :metadata="{ tooltip: textColorTooltip }"/>
    <v-form-group title="Font Size" type="fontSize" v-model="wData.settings.text_size"/>
  </validated-form>

  <validated-form slot="chatter-properties" v-if="loaded" @input="save()">
    <v-form-group title="Hide Characters">
      <bool-input title="Hide Common Chat Bots" v-model="wData.settings.hide_common_chat_bots"/>
      <bool-input title="Hide commands starting with `!`" v-model="wData.settings.hide_commands"/>
    </v-form-group>
    <v-form-group title="Muted Chatters" type="textArea" v-model="wData.settings.muted_chatters" />
  </validated-form>

</widget-editor>

</template>

<script lang="ts" src="./ChatBox.vue.ts"></script>
