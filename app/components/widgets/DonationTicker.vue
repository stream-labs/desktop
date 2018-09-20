<template>
<widget-window v-model="tab">
  <div slot="settings" v-if="loaded">
    <validated-form @input="save()">
      <h-form-group :title="$t('Message Format')" type="text" v-model="wData.settings.message_format" :metadata="{ tooltip: messageFormatTooltip }" />
      <h-form-group :title="$t('Max Donations')" type="number" v-model="wData.settings.max_donations" :metadata="{ tooltip: maxDonationsTooltip }" />
      <h-form-group :title="$t('Text Scroll Speed')" type="slider" v-model="wData.settings.scroll_speed" :metadata="{ max: 10, interval: 1, tooltip: scrollSpeedTooltip }" />
      <h-form-group :title="$t('Background Color')" type="color" v-model="wData.settings.background_color" :metadata="{ tooltip: backgroundColorTooltip }" />
      <h-form-group :title="$t('Font')" type="fontFamily" v-model="wData.settings.font" />
      <h-form-group :title="$t('Font Size')" type="fontSize" v-model="wData.settings.font_size" :metadata="{ tooltip: fontSizeTooltip }" />
      <h-form-group :title="$t('Font Weight')" type="slider" v-model="wData.settings.font_weight" :metadata="{ min: 300, max: 900, interval: 100, tooltip: fontWeightTooltip }" />
      <h-form-group :title="$t('Text Color')" type="color" v-model="wData.settings.font_color" :metadata="{ tooltip: textColorTooltip }" />
      <h-form-group :title="$t('Name Text Color')" type="color" v-model="wData.settings.font_color2" :metadata="{ tooltip: nameColorTooltip }" />
      <h-form-group :title="$t('Amount Text Color')" type="color" v-model="wData.settings.font_color3" :metadata="{ tooltip: amountColorTooltip }" />
    </validated-form>
  </div>

  <div slot="test" >
    <test-buttons :testers="['Donation']"/>
  </div>
</widget-window>
</template>

<script lang="ts" src="./DonationTicker.vue.ts"></script>
