<template>
<widget-window :requestState="requestState" :loaded="loaded"ref="layout" v-model="tabName">
  <div slot="settings" v-if="loaded">
    <form-group :title="$t('Enabled Events')">
      <bool-input
        v-for="key in Object.keys(wData.settings.types)"
        :key="key"
        :title="titleFromKey(key)"
        v-model="wData.settings.types[key].enabled"
      />
    </form-group>
    <form-group :title="$t('Jar Image')">
      <image-picker-input :metadata="{ options: inputOptions }" v-model="wData.settings.jar.type"/>
    </form-group>
    <form-group :title="$t('Text')">
      <bool-input :title="$t('Show Text')" v-model="wData.settings.text.show"/>
    </form-group>
    <form-group type="fontFamily" :value="wData.settings.text.font"/>
    <form-group :title="$t('Text Color')" type="color" v-model="wData.settings.text.color" :metadata="{ tooltip: textColorTooltip }"/>
    <form-group :title="$t('Font Size')" type="fontSize" v-model="wData.settings.text.size"/>
    <form-group v-if="wData.settings.types.twitch_bits" :title="$t('Minimum Bits')">
      <number-input v-model="wData.settings.types.twitch_bits.minimum_amount" :metadata="{ required: true, min: 1 }"/>
    </form-group>
    <form-group :title="$t('Minimum Tips')">
      <number-input v-model="wData.settings.types.tips.minimum_amount" :metadata="{ required: true, min: 1 }"/>
    </form-group>
    <form-group :title="$t('Background Color')" type="color" v-model="wData.settings.background_color" :metadata="{ description: backgroundColorDescription }" />
    <form-group title="timer">
      <timer-input :metadata="{ min: 0, max: 3600 }" />
    </form-group>
    <form-group v-for="key in mediaGalleryInputs" :key="key" :title="titleFromKey(key)">
      <media-gallery-input
        :metadata="{ clearImage: wData.defaultImage[`${platform}_account`] }"
        v-model="wData.settings.types[key].image_src"
      />
    </form-group>
    <form-group
      v-for="tier in wData.settings.types.tips.tiers"
      :key="tier.minimum_amount"
      :title="`${$t('Tips over')} ${tier.minimum_amount}`"
    >
      <media-gallery-input
        :metadata="{ clearImage: tier.clear_image }"
        v-model="tier.image_src"
      />
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

  <div slot="test" >
    <test-buttons :testers="['Follow', 'Subscription', 'Donation', 'Bits', 'Host']"/>
  </div>
</widget-window>
</template>

<script lang="ts" src="./TipJar.vue.ts"></script>
