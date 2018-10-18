<template>
<widget-editor :navItems="navItems">
  <validated-form slot="manage-list-properties" @input="save()" v-if="loaded">
    <v-form-group :title="$t('Message Format')" type="text" v-model="wData.settings.message_format" :metadata="{ tooltip: messageFormatTooltip }" />
    <v-form-group :title="$t('Max Donations')" type="number" v-model="wData.settings.max_donations" :metadata="{ tooltip: maxDonationsTooltip }" />
    <v-form-group :title="$t('Text Scroll Speed')" type="slider" v-model="wData.settings.scroll_speed" :metadata="{ max: 10, interval: 1, tooltip: scrollSpeedTooltip }" />
    <v-form-group :title="$t('Background Color')" type="color" v-model="wData.settings.background_color" :metadata="{ tooltip: backgroundColorTooltip }" />
  </validated-form>

  <validated-form slot="font-properties" @input="save()" v-if="loaded">
    <v-form-group :title="$t('Font')" type="fontFamily" v-model="wData.settings.font" />
    <v-form-group :title="$t('Font Size')" type="fontSize" v-model="wData.settings.font_size" :metadata="{ tooltip: fontSizeTooltip }" />
    <v-form-group :title="$t('Font Weight')" type="slider" v-model="wData.settings.font_weight" :metadata="{ min: 300, max: 900, interval: 100, tooltip: fontWeightTooltip }" />
    <v-form-group :title="$t('Text Color')" type="color" v-model="wData.settings.font_color" :metadata="{ tooltip: textColorTooltip }" />
    <v-form-group :title="$t('Name Text Color')" type="color" v-model="wData.settings.font_color2" :metadata="{ tooltip: nameColorTooltip }" />
    <v-form-group :title="$t('Amount Text Color')" type="color" v-model="wData.settings.font_color3" :metadata="{ tooltip: amountColorTooltip }" />
  </validated-form>
</widget-editor>
</template>

<script lang="ts" src="./DonationTicker.vue.ts"></script>
