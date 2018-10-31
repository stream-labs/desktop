<template>
<widget-editor
  :navItems="navItems"
  :isAlertBox="true"
  :slots="[{ value: 'layout', label: $t('Layout') }]"
  :selectedVariation="selectedVariation"
>
  <!-- Left Toolbar -->
  <div slot="leftbar">
    <div class="left-accordion__button">
      <span style="text-transform: uppercase;" :class="{ active: selectedAlert === 'general' }">
        {{ $t('Global Settings') }}
      </span>
    </div>
    <div class="left-accordion__button">
      <span class="button button--default add-alert-button" @click="toggleAddAlertMenu()">{{ $t('Add Alert') }}</span>
      <div v-if="addAlertMenuOpen" class="add-alert-dropdown">
        <button
          v-for="type in alertTypes"
          class="button button--action"
          :key="type"
          @click="addAlert(type)"
        >
          {{ $t('Add ') }}{{ alertName(type) }}
        </button>
      </div>
    </div>
    <div v-for="alert in alertTypes" v-if="wData && wData.settings[alert]" :key="alert" style="position: relative;" >
      <div class="left-accordion__button" :class="{ active: selectedAlert === alert }" @click="selectAlertType(alert)">
        <i :class="{ 'icon-add': selectedAlert !== alert, 'icon-subtract': selectedAlert === alert }" />
        <span class="left-accordion__title">{{ alertName(alert) }}</span>
      </div>
      <div class="left-accordion__input">
        <validated-form  @input="save()"><toggle-input v-model="wData.settings[alert].enabled" /></validated-form>
      </div>
      <div
        v-if="wData && selectedAlert === alert"
        v-for="variation in wData.settings[alert].variations"
        :key="variation.id"
        @click="selectVariation(variation.id)"
        class="variation-tile"
        :class="{ active: selectedId === variation.id }"
      >
        <div class="variation-tile__image-box">
          <img v-if="variation.settings.image.href" :src="variation.settings.image.href" />
          <div class="variation-tile__name">
            <input
              type="text"
              :value="variation.name"
              :disabled="editingName !== variation.id"
              :ref="`${variation.id}-name-input`"
              @input="nameInputHandler($event.target.value)"
              @blur="nameBlurHandler(variation.id)"
            />
          </div>
        </div>
        <div class="variation-tile__toolbar">
          <i v-if="variation.deleteable" class="icon-trash" @click.stop="removeVariation(variation.id)" />
          <i v-if="variation.id !== 'default'" class="icon-edit" @click.stop="editName(variation.id)" />
        </div>
      </div>
    </div>
  </div>

  <validated-form slot="layout" @input="save()">
    <alert-layout-input v-model="selectedVariation.settings.layout" v-if="selectedVariation" />
  </validated-form>

  <!-- Global Settings -->
  <validated-form slot="general-properties" @input="save()" v-if="selectedVariation">
    <v-form-group :title="$t('Background Color')" type="color" v-model="wData.settings.background_color" />
    <v-form-group :title="$t('Global Alert Delay')" type="slider" v-model="wData.settings.alert_delay" :metadata="{ min: 0, max: 30 }" />
  </validated-form>
  <validated-form slot="moderation-properties" @input="save()" v-if="selectedVariation">
    <v-form-group :title="$t('Unlimited Alert Moderation Delay')">
      <toggle-input v-model="wData.settings.unlimited_alert_moderation_enabled" />
    </v-form-group>
    <v-form-group :title="$t('Alert Moderation delay')" type="slider" v-model="wData.settings.moderation_delay" />
    <v-form-group :title="$t('Unlimited Media Sharing Alert Moderation Delay')">
      <toggle-input v-model="wData.settings.unlimited_media_moderation_delay" />
    </v-form-group>
  </validated-form>

  <!-- Alert-Specific Settings -->
  <validated-form slot="title-properties" key="title-properties" @input="save()" v-if="selectedVariation">
    <div v-if="selectedVariation.settings.text">
      <v-form-group :title="$t('Message Template')" type="textArea" v-model="selectedVariation.settings.text.format" />
      <v-form-group :title="$t('Font')" type="fontFamily" v-model="selectedVariation.settings.text.font" />
      <v-form-group :title="$t('Font Size')" type="fontSize" v-model="selectedVariation.settings.text.size" />
      <v-form-group :title="$t('Font Weight')" type="slider" v-model="selectedVariation.settings.text.thickness" :metadata="{ min: 300, max: 900, interval: 100 }" />
      <v-form-group :title="$t('Text Color Primary')" type="color" v-model="selectedVariation.settings.text.color" />
      <v-form-group :title="$t('Text Color secondary')" type="color" v-model="selectedVariation.settings.text.color2" />
    </div>
  </validated-form>
  <validated-form slot="media-properties" key="media-properties" @input="save()" v-if="selectedVariation">
    <v-form-group :title="$t('Image/Video File')">
      <media-gallery-input v-model="selectedVariation.settings.image.href" v-if="selectedVariation.settings.image" />
    </v-form-group>
    <v-form-group :title="$t('Sound File')" v-if="selectedVariation.settings.sound">
      <sound-input v-model="selectedVariation.settings.sound.href" />
    </v-form-group>
    <v-form-group :title="$t('Volume')" type="slider" v-model="selectedVariation.settings.sound.volume" :metadata="{ min: 0, max: 100 }" v-if="selectedVariation.settings.sound" />
  </validated-form>
  <validated-form slot="message-properties" key="message-properties" @input="save()" v-if="selectedVariation">
    <v-form-group :title="$t('Show Message?')" type="bool" v-model="selectedVariation.showMessage" />
    <div v-if="selectedVariation.settings.message">
      <v-form-group :title="$t('Min. Amount to Show')" type="number" v-model="selectedVariation.settings.message.minAmount" />
      <v-form-group :title="$t('Font')" type="fontFamily" v-model="selectedVariation.settings.message.font" />
      <v-form-group :title="$t('Font Size')" type="fontSize" v-model="selectedVariation.settings.message.size" />
      <v-form-group :title="$t('Font Weight')" type="slider" v-model="selectedVariation.settings.message.weight" :metadata="{ min: 300, max: 900, interval: 100 }" />
      <v-form-group :title="$t('Text Color')" type="color" v-model="selectedVariation.settings.message.color" />
      <v-form-group :title="$t('Allow Twitch Emojis?')" type="bool" v-model="selectedVariation.settings.message.allowEmojis" />
    </div>
    <div v-if="selectedVariation.settings.tts">
      <span>{{ $t('Text to Speech') }}</span>
      <v-form-group :title="$t('Enable TTS?')" type="bool" v-model="selectedVariation.settings.tts.enabled" />
      <v-form-group :title="$t('Min. Amount to Read')" type="number" v-model="selectedVariation.settings.tts.minAmount" />
      <v-form-group :title="$t('Volume')" type="slider" v-model="selectedVariation.settings.tts.volume" :metadata="{ min: 0, max: 100 }" />
      <v-form-group :title="$t('Language')" type="list" v-model="selectedVariation.settings.tts.language" />
      <v-form-group :title="$t('Spam Security')" type="slider" v-model="selectedVariation.settings.tts.security" />
    </div>
  </validated-form>
  <validated-form slot="animation-properties" key="animation-properties" @input="save()" v-if="selectedVariation">
    <v-form-group :title="$t('Show Animation')" type="animation" v-model="selectedVariation.settings.showAnimation" :metadata="{ filter: 'in' }" />
    <v-form-group :title="$t('Hide Animation')" type="animation" v-model="selectedVariation.settings.hideAnimation" :metadata="{ filter: 'out' }" />
    <v-form-group :title="$t('Alert Duration')" type="slider" v-model="selectedVariation.settings.duration" :metadata="{ min: 2, max: 300 }" />
    <v-form-group :title="$t('Text Animation')" type="animation" v-model="selectedVariation.settings.text.animation"  :metadata="{ filter: 'text' }" v-if="selectedVariation.settings.text" />
    <v-form-group :title="$t('Text Delay')" type="slider" v-model="selectedVariation.settings.textDelay" :metadata="{ min: 0, max: 60 }" />
  </validated-form>
  <validated-form slot="alert-properties" key="alert-properties" @input="save()" v-if="selectedVariation">
    <v-form-group :title="$t('Min. Amount to Trigger Alert')" type="number" v-model="minTriggerAmount" v-if="['donations', 'bits', 'hosts', 'raids'].includes(selectedAlert)" />
    <v-form-group :title="$t('Min. Amount to Show in Recent Events')" type="number" v-model="minRecentEvents" v-if="['donations', 'hosts'].includes(selectedAlert)" />
    <div v-if="selectedId !== 'default'">
      <v-form-group :title="$t('Variation Condition')" type="list" v-model="selectedVariation.condition" :metadata="{ options: conditions }" />
      <v-form-group :title="$t('Variation Frequency')" v-if="selectedVariation.condition === 'RANDOM'">
        <frequency-input v-model="selectedVariation.conditionData" />
      </v-form-group>
      <v-form-group :title="$t('Variation Amount')" type="number" v-model="selectedVariation.conditionData" v-if="selectedVariation.condition !== 'RANDOM'" />
    </div>
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

.add-alert-button {
  width: 100%;
  text-transform: uppercase;
  font-size: 12px;
}

.add-alert-dropdown {
  position: absolute;
  left: 0;
  top: 50px;
  background-color: @white;
  z-index: 1;
  box-shadow: 0 2px @day-shadow;
  padding: 8px;
  .button {
    display: block;
    width: 100%;
    font-size: 12px;
    line-height: 12px;
    margin-bottom: 4px;
  }
}

.left-accordion__title {
  width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  margin-left: 4px;
}

.left-accordion__input {
  position: absolute;
  top: 14px;
  right: 16px;
}

.leftbar {
  display: flex;
  flex-direction: column;
}

.variation-tile {
  .radius();
  width: 90%;
  margin: 8px auto;
  box-shadow: 0 2px @day-shadow;
  border: 1px solid @day-border;
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

.variation-tile.active {
  border: 1px solid @teal;

  .variation-tile__image-box {
    border: 1px solid @teal-light-opac;
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

  input, input:disabled {
    background-color: transparent;
    border: none;
    cursor: pointer;
  }
}

.variation-tile__toolbar {
  display: flex;
  justify-content: flex-end;
  padding-top: 2px;

  i {
    margin-left: 4px;
  }
}

.night-theme {
  .left-accordion__button {
    border-color: @night-border;
  }
  .add-alert-dropdown {
    background-color: @night-secondary;
    box-shadow: 0 2px @night-shadow;
  }
  .variation-tile {
    background-color: @night-section-alt;
    box-shadow: 0 2px @night-shadow;
    border-color: @night-border;
  }
  .variation-tile.active {
    border: 1px solid @teal;

    .variation-tile__image-box {
      border: 1px solid @teal-light-opac;
    }
  }
  .variation-tile__image-box {
    background-color: @night-secondary;
  }
  .variation-tile__name {
    background-color: @night-shadow;
  }
}
</style>
