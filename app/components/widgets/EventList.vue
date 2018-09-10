<template>
<widget-window :requestState="requestState" :loaded="loaded" ref="layout" v-model="tabName">
  <div slot="settings" v-if="loaded">
    <h-form-group :title="$t('Theme')" type="list" v-model="wData.settings.theme" :metadata="{ options: themeMetadata }"/>
    <h-form-group :title="$t('Theme Color')" type="color" v-model="wData.settings.theme_color" />
    <h-form-group :title="$t('Enable Events')">
      <bool-input :title="$t('Donations')" v-model="wData.settings.show_donations"/>
      <bool-input :title="$t('Follows')" v-model="wData.settings.show_follows"/>
      <bool-input :title="$t('Subscriptions')" v-model="wData.settings.show_subscriptions"/>
      <bool-input :title="$t('Show Resubs')" v-model="wData.settings.show_resubs"/>
      <bool-input :title="$t('Show Sub Tiers')" v-model="wData.settings.show_sub_tiers"/>
      <bool-input :title="$t('Hosts')" v-model="wData.settings.show_hosts"/>
      <bool-input :title="$t('Bits')" v-model="wData.settings.show_bits"/>
      <bool-input :title="$t('Raids')" v-model="wData.settings.show_raids"/>
      <bool-input :title="$t('Merch')" v-model="wData.settings.show_merch"/>
    </h-form-group>
    <h-form-group :title="$t('Min. Bits')" type="number" v-model="wData.settings.bits_minimum" :metadata="{ tooltip: minBitsTooltip }" />
    <h-form-group :title="$t('Max Events')" type="slider" v-model="wData.settings.max_events" :metadata="{ max: 10, interval: 1 }" />
    <h-form-group :title="$t('Background Color')" type="color" v-model="wData.settings.background_color" :metadata="{ tooltip: backgroundColorTooltip }" />
    <h-form-group :title="$t('Text Color')" type="color" v-model="wData.settings.text_color" :metadata="{ tooltip: textColorTooltip }" />
    <h-form-group :title="$t('Font')" type="fontFamily" v-model="wData.settings.font_family" :metadata="{ tooltip: fontFamilyTooltip }" />
    <h-form-group :title="$t('Font Size')" type="fontSize" v-model="wData.settings.text_size" :metadata="{ tooltip: fontSizeTooltip }" />
    <h-form-group :title="$t('Show Animation')">
      <animation-input v-model="wData.settings.show_animation" :metadata="{filter: 'in'}" />
    </h-form-group>
    <h-form-group :title="$t('Hide Animation')">
      <animation-input v-model="wData.settings.hide_animation" :metadata="{filter: 'out'}"/>
    </h-form-group>
    <h-form-group :title="$t('Animation Speed')" type="slider" v-model="wData.settings.animation_speed" :metadata="{ min: 250, max: 4000, interval: 250 }" />
    <h-form-group :title="$t('Fade Time')" type="slider" v-model="wData.settings.fade_time" :metadata="{ max: 60, interval: 1 }" />
    <h-form-group :title="$t('Other Options')">
      <bool-input :title="$t('Flip X')" v-model="wData.settings.flip_x" />
      <bool-input :title="$t('Flip Y')" v-model="wData.settings.flip_y" />
      <bool-input :title="$t('Keep Events History')" v-model="wData.settings.keep_history" />
    </h-form-group>
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

  <div slot="test" >
    <test-buttons :testers="['Follow', 'Subscription', 'Donation', 'Bits', 'Host']"/>
  </div>


</widget-window>
</template>

<script lang="ts" src="./EventList.vue.ts"></script>