<template>
<widget-window v-if="wData" ref="layout" v-model="tabName">

  <div slot="description">
    {{ $t('Include your channel\'s chat into your stream, and make it look pretty while you\'re at it.') }}
  </div>

  <div slot="settings">
    <w-form-group title="Enabled Events">
      <w-bool-input title="Tips &amp; Donations" v-model="wData.settings.types.tips.enabled"/>
      <w-bool-input title="Twitch Follows" v-model="wData.settings.types.twitch_follows.enabled"/>
      <w-bool-input title="Twitch Bits/Cheers" v-model="wData.settings.types.twitch_bits.enabled"/>
      <w-bool-input title="Twitch Subs" v-model="wData.settings.types.twitch_subs.enabled"/>
      <w-bool-input title="Twitch Resubs" v-model="wData.settings.types.twitch_resubs.enabled"/>
    </w-form-group>
    <w-form-group title="Jar Image">
      <w-image-picker
        :metadata="{ options: inputOptions }"
        v-model="wData.settings.jar.type"
      />
    </w-form-group>
    <w-form-group title="Text">
      <w-bool-input title="Show Text" v-model="wData.settings.text.show"/>
    </w-form-group>
    <w-form-group type="fontFamily" :value="wData.settings.text.font"/>
    <w-form-group title="Text Color" type="color" v-model="wData.settings.text.color" :metadata="{ tooltip: textColorTooltip }"/>
    <w-form-group title="Font Size" type="fontSize" v-model="wData.settings.text_size"/>
    <w-form-group title="Minimum Bits">
      <w-number-input v-model="wData.settings.types.twitch_bits.minimum_amount" :metadata="{ required: true, min: 1 }"/>
    </w-form-group>
    <w-form-group title="Minimum Tips">
      <w-number-input v-model="wData.settings.types.tips.minimum_amount" :metadata="{ required: true, min: 1 }"/>
    </w-form-group>
    <w-form-group title="Background Color" type="color" v-model="wData.settings.background_color" :metadata="{ description: backgroundColorDescription }" />
    <w-form-group title="Twitch Follows">
      <w-media-gallery-input />
    </w-form-group>
    <w-form-group title="Tips over 0">
      <w-media-gallery-input />
    </w-form-group>
    <w-form-group title="Tips over 3">
      <w-media-gallery-input />
    </w-form-group>
    <w-form-group title="Tips over 20">
      <w-media-gallery-input />
    </w-form-group>
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

<script lang="ts" src="./TipJar.vue.ts"></script>
