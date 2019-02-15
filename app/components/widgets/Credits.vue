<template>
<widget-editor :navItems="navItems">
  <validated-form slot="manage-credits-properties" @input="save()" v-if="loaded">
    <!-- <button class="button button--action" @click="rollCredits">{{ $t('Roll Credits') }}</button> -->
    <v-form-group v-model="wData.settings.credit_title" :metadata="metadata.title" />
    <v-form-group  v-model="wData.settings.credit_title" :metadata="metadata.subtitle" />
    <v-form-group :title="$t('Includes')">
      <bool-input :title="$t('Show Followers')" v-model="wData.settings.followers"/>
      <bool-input :title="$t('Show Subscribers')" v-model="wData.settings.subscribers"/>
      <bool-input :title="$t('Show donations')" v-model="wData.settings.donations"/>
      <bool-input :title="$t('Show Cheers')" v-model="wData.settings.bits"/>
      <bool-input :title="$t('Show Moderators')" v-model="wData.settings.moderators"/>
    </v-form-group>
    <v-form-group :title="$t('Followers')" type="text" v-model="wData.settings.followers_change" />
    <v-form-group :title="$t('Subscribers & Resubs')" type="text" v-model="wData.settings.subscribers_change" />
    <v-form-group :title="$t('Donors')" type="text" v-model="wData.settings.donor_change" />
    <v-form-group :title="$t('Cheers')" type="text" v-model="wData.settings.bits_change" />
    <v-form-group :title="$t('Moderators')" type="text" v-model="wData.settings.mods_change" />
  </validated-form>

  <validated-form slot="visual-properties" @input="save()" v-if="loaded">
    <v-form-group v-model="wData.settings.theme" :metadata="metadata.theme"/>
    <v-form-group v-model="wData.settings.background_color" :metadata="metadata.backgroundColor" />
    <v-form-group v-model="wData.settings.font" :metadata="metadata.fontFamily"/>
    <v-form-group v-model="wData.settings.font_size" :metadata="metadata.fontSize" />
    <v-form-group v-model="wData.settings.font_color" :metadata="metadata.fontColor"/>

    <v-form-group :title="$t('Loop Option')">
      <bool-input :title="$t('Loop the credits')" v-model="wData.settings.loop_credits"/>
    </v-form-group>
    <v-form-group v-model="wData.settings.delay_time" :metadata="metadata.delayTime" />
    <v-form-group v-model="wData.settings.roll_speed" :metadata="metadata.rollSpeed" />
    <v-form-group v-model="wData.settings.roll_time" :metadata="metadata.rollTime" />
  </validated-form>
</widget-editor>
</template>

<script lang="ts" src="./Credits.vue.ts"></script>
