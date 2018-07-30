<template>
<widget-window v-if="wData" ref="layout" v-model="tabName">

  <div slot="description">
    {{ $t('Include your channel\'s chat into your stream, and make it look pretty while you\'re at it.') }}
  </div>

  <div slot="settings">
    <form-group title="Enabled Events">
      <bool-input title="Tips &amp; Donations" v-model="wData.settings.types.tips.enabled"/>
      <bool-input title="Twitch Follows" v-model="wData.settings.types.twitch_follows.enabled"/>
      <bool-input title="Twitch Bits/Cheers" v-model="wData.settings.types.twitch_bits.enabled"/>
      <bool-input title="Twitch Subs" v-model="wData.settings.types.twitch_subs.enabled"/>
      <bool-input title="Twitch Resubs" v-model="wData.settings.types.twitch_resubs.enabled"/>
    </form-group>
    <form-group title="Jar Image">
      <image-picker
        :metadata="{ options: inputOptions }"
        v-model="wData.settings.jar.type"
      />
    </form-group>
    <form-group title="Text">
      <bool-input title="Show Text" v-model="wData.settings.text.show"/>
    </form-group>
    <form-group type="fontFamily" :value="wData.settings.text.font"/>
    <form-group title="Text Color" type="color" v-model="wData.settings.text.color" :metadata="{ tooltip: textColorTooltip }"/>
    <form-group title="Font Size" type="fontSize" v-model="wData.settings.text_size"/>
    <form-group title="Minimum Bits">
      <number-input v-model="wData.settings.types.twitch_bits.minimum_amount" :metadata="{ required: true, min: 1 }"/>
    </form-group>
    <form-group title="Minimum Tips">
      <number-input v-model="wData.settings.types.tips.minimum_amount" :metadata="{ required: true, min: 1 }"/>
    </form-group>
    <form-group title="Background Color" type="color" v-model="wData.settings.background_color" :metadata="{ description: backgroundColorDescription }" />
    <form-group title="Twitch Follows">
      <media-gallery-input
        :metadata="{ fileName: fileNameFromHref(wData.settings.types.twitch_follows.image_src), clearImage: wData.defaultImage.twitch_account }"
        v-model="wData.settings.types.twitch_follows.image_src"
      />
    </form-group>
    <form-group
      v-for="tier in wData.settings.types.tips.tiers"
      :key="tier.minimum_amount"
      :title="`Tips over ${tier.minimum_amount}`"
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
</widget-window>
</template>

<script lang="ts" src="./TipJar.vue.ts"></script>
