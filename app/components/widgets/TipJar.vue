<template>

<widget-window v-model="tab">
  <div slot="settings" v-if="loaded">
    <validated-form @input="save()">
      <h-form-group :title="$t('Enabled Events')">
        <bool-input
          v-for="key in Object.keys(wData.settings.types)"
          :key="key"
          :title="titleFromKey(key)"
          v-model="wData.settings.types[key].enabled"
        />
      </h-form-group>
      <h-form-group :title="$t('Jar Image')">
        <image-picker-input :metadata="{ options: inputOptions }" v-model="wData.settings.jar.type"/>
      </h-form-group>
      <h-form-group :title="$t('Text')">
        <bool-input :title="$t('Show Text')" v-model="wData.settings.text.show"/>
      </h-form-group>
      <h-form-group type="fontFamily" :value="wData.settings.text.font"/>
      <h-form-group :title="$t('Text Color')" type="color" v-model="wData.settings.text.color" :metadata="{ tooltip: textColorTooltip }"/>
      <h-form-group :title="$t('Font Size')" type="fontSize" v-model="wData.settings.text.size"/>
      <h-form-group v-if="wData.settings.types.twitch_bits" :title="$t('Minimum Bits')">
        <number-input v-model="wData.settings.types.twitch_bits.minimum_amount" :metadata="{ required: true, min: 1 }"/>
      </h-form-group>
      <h-form-group :title="$t('Minimum Tips')">
        <number-input v-model="wData.settings.types.tips.minimum_amount" :metadata="{ required: true, min: 1 }"/>
      </h-form-group>
      <h-form-group :title="$t('Background Color')" type="color" v-model="wData.settings.background_color" :metadata="{ description: backgroundColorDescription }" />
      <h-form-group v-for="key in mediaGalleryInputs" :key="key" :title="titleFromKey(key)">
        <media-gallery-input
          :metadata="{ clearImage: wData.defaultImage[`${platform}_account`] }"
          v-model="wData.settings.types[key].image_src"
        />
      </h-form-group>
      <h-form-group
        v-for="tier in wData.settings.types.tips.tiers"
        :key="tier.minimum_amount"
        :title="`${$t('Tips over')} ${tier.minimum_amount}`"
      >
        <media-gallery-input
          :metadata="{ clearImage: tier.clear_image }"
          v-model="tier.image_src"
        />
      </h-form-group>
    </validated-form>

  </div>

  <div slot="test" >
    <test-buttons :testers="['Follow', 'Subscription', 'Donation', 'Bits', 'Host']"/>
  </div>
</widget-window>
</template>

<script lang="ts" src="./TipJar.vue.ts"></script>
