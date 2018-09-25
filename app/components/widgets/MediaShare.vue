<template>
<widget-window v-if="wData" :requestState="requestState" :loaded="loaded" ref="layout" v-model="tabName">

  <div slot="settings" >
    <form-group :title="$t('Price Per Second')" :metadata="{ tooltip: pricePerSecTooltip }">
      <number-input v-model="wData.settings.price_per_second" />
      <span>{{ $t('USD') }}</span>
    </form-group>
    <form-group :title="$t('Min. Amount to Share')" :metadata="{ tooltip: minAmountTooltip }">
      <number-input v-model="wData.settings.min_amount_to_share" />
      <span>{{ $t('USD') }}</span>
    </form-group>
    <form-group :title="$t('Max Duration')" :metadata="{ tooltip: maxDurationTooltip }">
      <number-input v-model="wData.settings.max_duration" />
      <span>{{ $t('seconds') }}</span>
    </form-group>
    <form-group :title="$t('Buffer Time')" type="slider" v-model="wData.settings.buffer_time" :metadata="bufferMeta" />
    <form-group :title="$t('Spam Security')" type="slider" v-model="wData.settings.security" :metadata="securityMeta" />
  </div>
  <div slot="banned_media">
    <table v-if="wData.banned_media && wData.banned_media.length > 0">
      <thead>
        <tr>
          <th> {{ $t('Video') }} </th>
          <th> {{ $t('Banned By') }} </th>
          <th> {{ $t('Unban') }} </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="media in wData.banned_media"
          :key="media.id"
        >
          <td> {{ media.media_title }} </td>
          <td> {{ media.action_by }} </td>
          <td>
            <button
              @click="onUnbanMediaHandler(media)"
              class="button button--default"
            >{{ $t('Unban') }}</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="media-share-placeholder">
      <img class="media-share-placeholder__img media-share-placeholder__img--day" src="../../../media/images/sleeping-kevin-day.png">
      <img class="media-share-placeholder__img media-share-placeholder__img--night" src="../../../media/images/sleeping-kevin-night.png">
      <span>{{ $t("You have not banned any media yet.") }}</span>
    </div>
  </div>
</widget-window>

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