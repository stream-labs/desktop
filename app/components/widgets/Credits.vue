<template>
<widget-window :requestState="requestState" :loaded="loaded" ref="layout" v-model="tabName">
  <div slot="settings" v-if="loaded">
    <form-group :title="$t('Theme')" type="list" v-model="wData.settings.theme" :metadata="{ options: themeMetadata }"/>
    <form-group :title="$t('Credit Title')" type="text" v-model="wData.settings.credit_title" />
    <form-group
      :title="$t('Credit Subtitle')"
      type="text"
      v-model="wData.settings.credit_title"
      :metadata="{ tooltip: creditsSubtitleTooltip }"
    />
    <form-group type="color" :title="$t('Background Color')" v-model="wData.settings.background_color"/>
    <form-group type="fontFamily" :value="wData.settings.font" :metadata="{ tooltip: fontFamilyTooltip }"/>
    <form-group :title="$t('Font Size')" type="fontSize" v-model="wData.settings.font_size"/>
    <form-group type="color" :title="$t('Text Color')" v-model="wData.settings.font_color" :metadata="{ tooltip: textColorTooltip }"/>

    <form-group :title="$t('Includes')">
      <bool-input :title="$t('Show Followers')" v-model="wData.settings.followers"/>
      <bool-input :title="$t('Show Subscribers')" v-model="wData.settings.subscribers"/>
      <bool-input :title="$t('Show donations')" v-model="wData.settings.donations"/>
      <bool-input :title="$t('Show Cheers')" v-model="wData.settings.bits"/>
      <bool-input :title="$t('Show Moderators')" v-model="wData.settings.moderators"/>
    </form-group>

    <form-group :title="$t('Followers')" type="text" v-model="wData.settings.followers_change" />
    <form-group :title="$t('Subscribers & Resubs')" type="text" v-model="wData.settings.subscribers_change" />
    <form-group :title="$t('Donors')" type="text" v-model="wData.settings.donor_change" />
    <form-group :title="$t('Cheers')" type="text" v-model="wData.settings.bits_change" />
    <form-group :title="$t('Moderators')" type="text" v-model="wData.settings.mods_change" />

    <form-group :title="$t('Loop Option')">
      <bool-input :title="$t('Loop the credits')" v-model="wData.settings.loop_credits"/>
    </form-group>

    <form-group
      type="slider"
      :title="$t('Delay Time')"
      v-model="wData.settings.delay_time"
      :metadata="{ tooltip: delayTimeTooltip, max: 10, interval: 1 }"
    />
    <form-group
      type="slider"
      :title="$t('Roll Speed')"
      v-model="wData.settings.roll_speed"
      :metadata="{ tooltip: rollSpeedTooltip, max: 5, interval: 1 }"
    />
    <form-group
      type="slider"
      :title="$t('Roll Time')"
      v-model="wData.settings.roll_time"
      :metadata="{ tooltip: rollTimeTooltip, max: 150, interval: 5 }"
    />
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

<script lang="ts" src="./Credits.vue.ts"></script>
