<template>
<widget-editor :navItems="navItems">

  <validated-form slot="visual-properties" name="visual-properties-form" key="visual-properties" v-if="loaded" @input="save()">
    <v-form-group title="Theme" type="list" v-model="wData.settings.theme" :metadata="metadata.theme"/>
    <v-form-group title="Badges">
      <bool-input v-model="wData.settings.show_moderator_icons" :metadata="metadata.show_moderator_icons"/>
      <bool-input v-model="wData.settings.show_subscriber_icons" :metadata="metadata.show_subscriber_icons"/>
      <bool-input v-model="wData.settings.show_turbo_icons" :metadata="metadata.show_turbo_icons"/>
      <bool-input v-model="wData.settings.show_premium_icons" :metadata="metadata.show_premium_icons"/>
      <bool-input v-model="wData.settings.show_bits_icons" :metadata="metadata.show_bits_icons"/>
      <bool-input v-model="wData.settings.show_coin_icons" :metadata="metadata.show_coin_icons"/>
    </v-form-group>
    <v-form-group title="Extra Emotes">
      <bool-input v-model="wData.settings.show_bttv_emotes" :metadata="metadata.show_bttv_emotes"/>
      <bool-input v-model="wData.settings.show_franker_emotes" :metadata="metadata.show_franker_emotes"/>
    </v-form-group>
    <v-form-group v-model="wData.settings.background_color" :metadata="metadata.background_color" />
    <v-form-group title="Hide Message after">
      <bool-input v-model="wData.settings.always_show_messages" :metadata="metadata.always_show_messages"/>
      <slider-input v-model="wData.settings.message_hide_delay" :metadata="metadata.message_hide_delay"/>
    </v-form-group>
  </validated-form>

  <validated-form slot="font-properties" name="font-properties-form" key="font-properties" v-if="loaded" @input="save()">
    <v-form-group type="color" v-model="wData.settings.text_color" :metadata="metadata.text_color"/>
    <v-form-group type="fontSize" v-model="wData.settings.text_size" :metadata="metadata.text_size"/>
  </validated-form>

  <validated-form slot="chatter-properties" key="chatter-properties" name="chatter-properties" v-if="loaded" @input="save()">
    <v-form-group title="Hide Characters">
      <bool-input title="Hide Common Chat Bots" v-model="wData.settings.hide_common_chat_bots"/>
      <bool-input title="Hide commands starting with `!`" v-model="wData.settings.hide_commands"/>
    </v-form-group>
    <v-form-group title="Muted Chatters" type="textArea" v-model="wData.settings.muted_chatters" />
  </validated-form>


</widget-editor>

</template>

<script lang="ts" src="./ChatBox.vue.ts"></script>
