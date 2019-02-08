<template>
<widget-editor :slots="[{ value: 'banlist', label: $t('Banned Media') }]" :navItems="navItems" v-if="wData">

  <div slot="banlist">
    <button
      @click="openBlacklist()"
      class="button button--action banned-media-button"
    >
      {{ $t('Check Banned Media') }}
    </button>
  </div>

  <validated-form slot="media-properties" @input="save()" v-if="loaded">
    <v-form-group :title="$t('Price Per Second')" :metadata="{ tooltip: pricePerSecTooltip }">
      <number-input v-model="wData.settings.price_per_second" />
      <span>{{ $t('USD') }}</span>
    </v-form-group>
    <v-form-group :title="$t('Min. Amount to Share')" :metadata="{ tooltip: minAmountTooltip }">
      <number-input v-model="wData.settings.min_amount_to_share" />
      <span>{{ $t('USD') }}</span>
    </v-form-group>
    <v-form-group :title="$t('Max Duration')" :metadata="{ tooltip: maxDurationTooltip, isInteger: true }">
      <number-input v-model="wData.settings.max_duration" />
      <span>{{ $t('seconds') }}</span>
    </v-form-group>
    <v-form-group :title="$t('Buffer Time')" type="slider" v-model="wData.settings.buffer_time" :metadata="bufferMeta" />
    <v-form-group :title="$t('Spam Security')" type="spamSecurity" v-model="wData.settings.security" :metadata="{ tooltip: securityDescription }" />
  </validated-form>
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

.banned-media-button {
  display: block;
  margin: 0 auto;
}
</style>