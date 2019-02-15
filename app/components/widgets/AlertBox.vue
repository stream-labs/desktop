<template>
<widget-editor
  :navItems="navItems"
  :isAlertBox="true"
  :slots="[{ value: 'layout', label: $t('Layout') }]"
  :selectedVariation="selectedVariation"
  :selectedAlert="selectedAlert"
  :selectedId="selectedId"
>
  <!-- Left Toolbar -->
  <div slot="leftbar" v-if="wData">
    <div class="left-accordion__button alert-button">
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
    <div class="left-accordion__button" :class="{ active: selectedAlert === 'general' }" @click="selectAlertType('general')">
      {{ $t('Global Settings') }}
    </div>
    <div v-for="alert in alertTypes" :key="alert" style="position: relative;" >
      <div class="left-accordion__button" :class="{ active: selectedAlert === alert }" @click="selectAlertType(alert)">
        <i :class="{ 'icon-add': selectedAlert !== alert, 'icon-subtract': selectedAlert === alert }" />
        <span class="left-accordion__title">{{ alertName(alert) }}</span>
      </div>
      <div class="left-accordion__input" v-if="wData.settings[alert]">
        <validated-form  @input="save()"><toggle-input v-model="wData.settings[alert].enabled" /></validated-form>
      </div>
      <div v-if="wData && selectedAlert === alert">
        <div
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
            <i v-if="variation.id !== 'default'" class="icon-trash" @click.stop="removeVariation(variation.id)" />
            <i v-if="variation.id !== 'default'" class="icon-edit" @click.stop="editName(variation.id)" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <validated-form slot="layout" @input="save()">
    <alert-layout-input v-model="selectedVariation.settings.layout" v-if="selectedVariation" />
  </validated-form>

  <!-- Global Settings -->
  <validated-form slot="general-properties" @input="save()" v-if="selectedVariation">
    <v-form-group v-model="wData.settings.background_color" :metadata="metadata.bgColor" />
    <v-form-group v-model="wData.settings.alert_delay" :metadata="metadata.alertDelay" />
  </validated-form>
  <validated-form slot="moderation-properties" @input="save()" v-if="selectedVariation">
    <v-form-group v-model="wData.settings.unlimited_alert_moderation_enabled" :metadata="metadata.unlimitedAlertMod" />
    <v-form-group v-model="wData.settings.moderation_delay" :metadata="metadata.moderationDelay" />
    <v-form-group v-model="wData.settings.unlimited_media_moderation_delay" :metadata="metadata.unlimitedMediaMod" />
  </validated-form>

  <!-- Alert-Specific Settings -->
  <validated-form slot="title-properties" key="title-properties" @input="save()" v-if="selectedVariation">
    <div v-if="selectedVariation.settings.text">
      <v-form-group v-model="selectedVariation.settings.text.format" :metadata="metadata.template" />
      <v-form-group v-model="selectedVariation.settings.text.font" :metadata="metadata.fontFamily" />
      <v-form-group v-model="selectedVariation.settings.text.size" :metadata="metadata.fontSize" />
      <v-form-group v-model="selectedVariation.settings.text.thickness" :metadata="metadata.textThickness" />
      <v-form-group v-model="selectedVariation.settings.text.color" :metadata="metadata.primaryColor" />
      <v-form-group v-model="selectedVariation.settings.text.color2" :metadata="metadata.secondaryColor" />
    </div>
  </validated-form>
  <validated-form slot="media-properties" key="media-properties" @input="save()" v-if="selectedVariation">
    <v-form-group v-model="selectedVariation.settings.image.href" :metadata="metadata.imageFile" v-if="selectedVariation.settings.image" />
    <v-form-group :metadata="metadata.soundFile" v-model="selectedVariation.settings.sound.href" v-if="selectedVariation.settings.sound" />
    <v-form-group v-model="selectedVariation.settings.sound.volume" :metadata="metadata.soundVolume" v-if="selectedVariation.settings.sound" />
  </validated-form>
  <validated-form slot="message-properties" key="message-properties" @input="save()" v-if="selectedVariation">
    <v-form-group v-model="selectedVariation.showMessage" :metadata="metadata.showMessage" />
    <div v-if="selectedVariation.settings.message">
      <v-form-group v-model="selectedVariation.settings.message.minAmount" :metadata="metadata.minAmount" />
      <v-form-group v-model="selectedVariation.settings.message.font" :metadata="metadata.fontFamily" />
      <v-form-group v-model="selectedVariation.settings.message.size" :metadata="metadata.fontSize" />
      <v-form-group v-model="selectedVariation.settings.message.weight" :metadata="metadata.messageWeight" />
      <v-form-group v-model="selectedVariation.settings.message.color" :metadata="metadata.textColor" />
      <v-form-group v-model="selectedVariation.settings.message.allowEmojis" :metadata="metadata.messageEmojis" />
    </div>
    <div v-if="selectedVariation.settings.tts">
      <span>{{ $t('Text to Speech') }}</span>
      <v-form-group v-model="selectedVariation.settings.tts.enabled" :metadata="metadata.ttsEnabled" />
      <v-form-group v-model="selectedVariation.settings.tts.minAmount" :metadata="metadata.ttsMinAmount" />
      <v-form-group v-model="selectedVariation.settings.tts.volume" :metadata="metadata.ttsVolume" />
      <v-form-group v-model="selectedVariation.settings.tts.language" :metadata="metadata.ttsLanguage" />
      <v-form-group v-model="selectedVariation.settings.tts.security" :metadata="metadata.ttsSecurity" />
    </div>
  </validated-form>
  <validated-form slot="animation-properties" key="animation-properties" @input="save()" v-if="selectedVariation">
    <v-form-group v-model="selectedVariation.settings.showAnimation" :metadata="metadata.showAnimation" />
    <v-form-group v-model="selectedVariation.settings.hideAnimation" :metadata="metadata.hideAnimation" />
    <v-form-group v-model="selectedVariation.settings.duration" :metadata="metadata.duration" />
    <v-form-group v-model="selectedVariation.settings.text.animation"  :metadata="metadata.textAnimation" v-if="selectedVariation.settings.text" />
    <v-form-group v-model="selectedVariation.settings.textDelay" :metadata="metadata.textDelay" />
  </validated-form>
  <validated-form slot="alert-properties" key="alert-properties" @input="save()" v-if="selectedVariation">
    <v-form-group v-model="minTriggerAmount" :metadata="metadata.minTriggerAmount" v-if="['donations', 'bits', 'hosts', 'raids'].includes(selectedAlert)" />
    <v-form-group v-model="minRecentEvents" :metadata="metadata.minRecentEvents" v-if="['donations', 'hosts'].includes(selectedAlert)" />
    <div v-if="selectedId !== 'default'">
      <v-form-group v-model="selectedVariation.condition" :metadata="metadata.conditions" />
      <v-form-group v-model="selectedVariation.conditionData" :metadata="metadata.variationFrequency" v-if="selectedVariation.condition === 'RANDOM'" />
      <v-form-group v-model="selectedVariation.conditionData" :metadata="metadata.conditionData" v-if="selectedVariation.condition !== 'RANDOM'" />
    </div>
  </validated-form>
</widget-editor>
</template>

<script lang="ts" src="./AlertBox.vue.ts"></script>

<style lang="less" scoped>
@import '../../styles/index';

.left-accordion__button {
  display: flex;
  border-bottom: 1px solid @day-border;
  .padding();
  .weight(@medium);
  position: relative;
  align-items: center;

  i {
    font-size: 12px;
    .margin-right();
  }

  &:hover {
    cursor: pointer;
  }
}

.left-accordion__button.alert-button {
  padding: 7.5px;
}

.left-accordion__button.active {
  background-color: @teal-light-opac;
}

.add-alert-button {
  width: 100%;
}

.add-alert-dropdown {
  position: absolute;
  left: 0;
  top: 50px;
  background-color: @white;
  z-index: 1;
  box-shadow: 0 2px @day-shadow;
  .padding();

  .button {
    display: block;
    width: 100%;
    line-height: 12px;
    margin-bottom: 4px;
  }
}

.left-accordion__title {
  width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: 4px;
}

.left-accordion__input {
  position: absolute;
  top: 10px;
  right: 8px;
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
  .padding();

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
  height: 60px;
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

  input,
  input:disabled {
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

  .left-accordion__button.active {
    background-color: @night-secondary;
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
