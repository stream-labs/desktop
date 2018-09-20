<template>
<widget-editor
  :slots="[{ value: 'jar', label: $t('Jar Image') }]"
  :navItems="navItems"
>
  <validated-form slot="jar" @input="save()" v-if="loaded">
      <image-picker-input :metadata="{ options: inputOptions }" v-model="wData.settings.jar.type"/>
  </validated-form>

  <validated-form slot="manage-jar-properties" @input="save()" v-if="loaded">
    <v-form-group :title="$t('Enabled Events')">
      <bool-input
        v-for="key in Object.keys(wData.settings.types)"
        :key="key"
        :title="titleFromKey(key)"
        v-model="wData.settings.types[key].enabled"
      />
    </v-form-group>
    <v-form-group v-if="wData.settings.types.twitch_bits" :title="$t('Minimum Bits')">
      <number-input v-model="wData.settings.types.twitch_bits.minimum_amount" :metadata="{ required: true, min: 1 }"/>
    </v-form-group>
    <v-form-group :title="$t('Minimum Tips')">
      <number-input v-model="wData.settings.types.tips.minimum_amount" :metadata="{ required: true, min: 1 }"/>
    </v-form-group>
    <v-form-group :title="$t('Background Color')" type="color" v-model="wData.settings.background_color" :metadata="{ description: backgroundColorDescription }" />
  </validated-form>

  <validated-form slot="font-properties" @input="save()" v-if="loaded">
    <v-form-group :title="$t('Text')">
      <bool-input :title="$t('Show Text')" v-model="wData.settings.text.show"/>
    </v-form-group>
    <v-form-group type="fontFamily" :value="wData.settings.text.font"/>
    <v-form-group :title="$t('Text Color')" type="color" v-model="wData.settings.text.color" :metadata="{ tooltip: textColorTooltip }"/>
    <v-form-group :title="$t('Font Size')" type="fontSize" v-model="wData.settings.text.size"/>
  </validated-form>

  <validated-form slot="images-properties" @input="save()" v-if="loaded">
    <v-form-group v-for="key in mediaGalleryInputs" :key="key" :title="titleFromKey(key)">
      <media-gallery-input
        :metadata="{ clearImage: wData.defaultImage[`${platform}_account`] }"
        v-model="wData.settings.types[key].image_src"
      />
    </v-form-group>
    <v-form-group
      v-for="tier in wData.settings.types.tips.tiers"
      :key="tier.minimum_amount"
      :title="`${$t('Tips over')} ${tier.minimum_amount}`"
    >
      <media-gallery-input
        :metadata="{ clearImage: tier.clear_image }"
        v-model="tier.image_src"
      />
    </v-form-group>
  </validated-form>

</widget-editor>
</template>

<script lang="ts" src="./TipJar.vue.ts"></script>
