<template>
<widget-window v-if="wData" ref="layout" v-model="tabName">

  <div slot="description">
    {{ $t('Following in the footsteps of some other similar Twitch services, we\'ve decided to make our own take on a jar that catches bits, tips, and more. Copy the Widget URL into your streaming software, or launch it and capture it.') }}
  </div>

  <div slot="settings">
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
    <form-group :title="$t('Font Size')" type="fontSize" v-model="wData.settings.text_size"/>
    <form-group v-if="wData.settings.types.twitch_bits" :title="$t('Minimum Bits')">
      <number-input v-model="wData.settings.types.twitch_bits.minimum_amount" :metadata="{ required: true, min: 1 }"/>
    </form-group>
    <form-group :title="$t('Minimum Tips')">
      <number-input v-model="wData.settings.types.tips.minimum_amount" :metadata="{ required: true, min: 1 }"/>
    </form-group>
    <form-group :title="$t('Background Color')" type="color" v-model="wData.settings.background_color" :metadata="{ description: backgroundColorDescription }" />
    <form-group v-for="key in mediaGalleryInputs" :key="key" :title="titleFromKey(key)">
      <media-gallery-input
        :metadata="{ fileName: fileNameFromHref(wData.settings.types[key].image_src), clearImage: wData.defaultImage[`${platform}_account`] }"
        v-model="wData.settings.types[key].image_src"
      />
    </form-group>
    <form-group
      v-for="tier in wData.settings.types.tips.tiers"
      :key="tier.minimum_amount"
      :title="`${$t('Tips over')} ${tier.minimum_amount}`"
    >
      <media-gallery-input
        :metadata="{ fileName: fileNameFromHref(tier.image_src), clearImage: tier.clear_image }"
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
