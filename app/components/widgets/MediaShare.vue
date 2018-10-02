<template>
<widget-editor :slots="[{ value: 'banlist', label: $t('Banned Media') }]" :navItems="navItems">

  <div slot="banlist">
    <button @click="openBlacklist()" class="button button--active">{{ $t('Check Banned Media') }}</button>
  </div>

  <div slot="media-properties" >
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
    <v-form-group :title="$t('Buffer Time')" type="slider" v-model="wData.settings.buffer_time" :metadata="bufferMeta" />
    <v-form-group :title="$t('Spam Security')" type="slider" v-model="wData.settings.security" :metadata="securityMeta" />
  </div>
</widget-editor>

</template>

<script lang="ts" src="./MediaShare.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";
.media-share-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  span {
    color: @grey;
    font-size: 12px;
  }
}

.media-share-placeholder__img {
  margin-bottom: 20px;
  width: 40%;
}

.media-share-placeholder__img--night {
  display: none;
}


.night-theme {
  .media-share-placeholder__img--day {
    display: none;
  }

  .media-share-placeholder__img--night {
    display: block;
  }
}


</style>