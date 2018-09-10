<template>
<widget-window v-if="wData" ref="layout" v-model="tabName">

  <div slot="settings" >
    <v-form-group :title="$t('Price Per Second')" :metadata="{ tooltip: pricePerSecTooltip }">
      <number-input v-model="wData.settings.price_per_second" />
      <span>{{ $t('USD') }}</span>
    </v-form-group>
    <v-form-group :title="$t('Min. Amount to Share')" :metadata="{ tooltip: minAmountTooltip }">
      <number-input v-model="wData.settings.min_amount_to_share" />
      <span>{{ $t('USD') }}</span>
    </v-form-group>
    <v-form-group :title="$t('Max Duration')" :metadata="{ tooltip: maxDurationTooltip }">
      <number-input v-model="wData.settings.max_duration" />
      <span>{{ $t('seconds') }}</span>
    </v-form-group>
    <v-form-group :title="$t('Buffer Time')" type="slider" v-model="wData.settings.advanced_settings.buffer_time" :metadata="bufferMeta" />
    <v-form-group :title="$t('Spam Security')" type="slider" v-model="wData.settings.security" :metadata="securityMeta" />
  </div>
</widget-window>

</template>

<script lang="ts" src="./MediaShare.vue.ts"></script>