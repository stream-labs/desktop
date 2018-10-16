<template>
  <widget-editor
    :navItems="navItems"
    :isAlertBox="true"
    :slots="[{ value: 'layout', label: $t('Layout') }]"
  >
    <div slot="leftbar">
      <div class="left-accordion__button">
        <span class="left-accordion__title" :class="{ active: selectedAlert === alert }">
          {{ $t('General Settings') }}
        </span>
      </div>
      <div class="left-accordion__button">
        <span class="left-accordion__title">{{ $t('Add Alert') }}</span>
      </div>
      <div v-for="alert in alertTypes" v-if="wData" :key="alert">
        <div class="left-accordion__button" :class="{ active: selectedAlert === alert }" @click="selectAlertType(alert)">
          <i :class="{ 'icon-add': selectedAlert !== alert, 'icon-subtract': selectedAlert === alert }" />
          <span class="left-accordion__title">{{ alertName(alert) }}</span>
          <div class="left-accordion__input"><toggle-input v-model="wData.settings[alert].enabled" /></div>
        </div>
        <div
          v-if="selectedAlert === alert"
          v-for="variation in wData.settings[alert].variations"
          :key="variation.id"
          @click="selectVariation(variation.id)"
          class="variation-tile"
          :class="{ active: selectedId === variation.id }"
        >
          <div class="variation-tile__image-box">
            <img v-if="variation.settings.image.href" :src="variation.settings.image.href" />
            <span class="variation-tile__name">{{ variation.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <validated-form slot="general-properties" v-if="wData">
      <v-form-group type="color" v-model="wData.settings.background_color" :title="$t('Background Color')" />
      <v-form-group type="slider" v-model="wData.settings.alert_delay" :title="$t('Global Alert Delay')" :metadata="{ min: 0, max: 30 }" />
    </validated-form>

    <validated-form slot="moderation-properties" v-if="wData">
      <v-form-group type="toggle" :title="$t('Unlimited Alert Moderation Delay')" v-model="wData.settings.unlimited_alert_moderation_enabled" />
      <v-form-group type="slider" :title="$t('Alert Moderation delay')" v-model="wData.settings.moderation_delay" />
      <v-form-group type="toggle" :title="$t('Unlimited Media Sharing Alert Moderation Delay')" v-model="wData.settings.unlimited_media_moderation_delay" />
    </validated-form>
  </widget-editor>
</template>

<script lang="ts" src="./AlertBox.vue.ts"></script>

<style lang="less" scoped>
@import '../../styles/index';

.left-accordion__button {
  display: flex;
  border-top: 1px solid @day-border;
  padding: 12px;
  font-size: 12px;
  position: relative;
  align-items: center;

  i {
    font-size: 11px;
  }

  &:hover {
    cursor: pointer;
  }
}

.left-accordion__title {
  width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  margin-left: 4px;
}

.left-accordion__input {
  margin-left: auto;
}

.leftbar {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.variation-tile {
  .radius();
  width: 90%;
  margin: 8px auto;
  box-shadow: 0 2px @day-shadow;
  height: 100px;
  position: relative;
  padding: 6px;

  img {
    height: 60px;
    margin: 0 auto;
    display: block;
  }

  &:hover {
    cursor: pointer;
  }
}

.variation-tile__image-box {
  width: 100%;
  display: block;
  margin: 4px auto;
  overflow: hidden;
  position: relative;
}

.variation-tile__name {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 4px;
  background-color: @day-shadow;
}

.night-theme {
  .left-accordion__button {
    border-color: @night-border;
  }
  .variation-tile {
    background-color: @night-section-alt;
    box-shadow: 0 2px @night-shadow;
  }
  .variation-tile__image-box {
    background-color: @night-secondary;
  }
  .variation-tile__name {
    background-color: @night-shadow;
  }
}
</style>
