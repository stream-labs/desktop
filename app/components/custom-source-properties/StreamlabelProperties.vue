<template>
<div>
  <div class="input-container select">
    <div class="input-label">
      <label>{{ $t('Label Type') }}</label>
    </div>
    <div class="input-wrapper">
      <multiselect
        :options="statOptions"
        group-label="label"
        group-values="files"
        track-by="name"
        label="label"
        :allow-empty="false"
        :value="currentlySelected"
        @input="handleInput"/>
    </div>
  </div>
  <div class="input-container" v-if="labelSettings.format != null">
    <div class="input-label">
      <label>{{ $t('Label Template') }}</label>
    </div>
    <div class="input-wrapper">
      <input
        type="text"
        v-model="labelSettings.format"
        @input="debouncedSetSettings"/>
      <div>
        <b>Tokens:</b>
        <span
          class="streamlabel-token"
          v-for="token in currentlySelected.settings.format.tokens"
          :key="token">
          {{ token }}
        </span>
      </div>
    </div>
  </div>
  <div class="input-container" v-if="labelSettings.item_format != null">
    <div class="input-label">
      <label>{{ $t('Item Template') }}</label>
    </div>
    <div class="input-wrapper">
      <input
        type="text"
        v-model="labelSettings.item_format"
        @input="debouncedSetSettings"/>
      <div>
        <b>Tokens:</b>
        <span
          class="streamlabel-token"
          v-for="token in currentlySelected.settings.item_format.tokens"
          :key="token">
          {{ token }}
        </span>
      </div>
    </div>
  </div>
  <div class="input-container" v-if="labelSettings.item_separator != null">
    <div class="input-label">
      <label>{{ $t('Item Separator') }}</label>
    </div>
    <div class="input-wrapper">
      <input
        type="text"
        v-model="labelSettings.item_separator"
        @input="debouncedSetSettings"/>
      <div>
        <b>Tokens:</b>
        <span
          class="streamlabel-token"
          v-for="token in currentlySelected.settings.item_separator.tokens"
          :key="token">
          {{ token }}
        </span>
      </div>
    </div>
  </div>
  <div class="input-container" v-if="labelSettings.limit != null">
    <div class="input-label">
      <label>{{ $t('Item Limit') }}</label>
    </div>
    <div class="input-wrapper">
      <input
        type="text"
        v-model="labelSettings.limit"
        @input="debouncedSetSettings"/>
    </div>
  </div>
  <div class="input-container" v-if="labelSettings.duration != null">
    <div class="input-label">
      <label>{{ $t('Duration (seconds)') }}</label>
    </div>
    <div class="input-wrapper">
      <input
        type="text"
        v-model="labelSettings.duration"
        @input="debouncedSetSettings"/>
    </div>
  </div>
  <div class="input-container select" v-if="labelSettings.show_clock != null">
    <div class="input-label">
      <label>{{ $t('Show Clock') }}</label>
    </div>
    <div class="input-wrapper">
      <multiselect
        :options="['always', 'active']"
        :custom-label="val => {
          return val === 'always' ?
            $t('Always, show 0:00 when inactive') :
            $t('Hide when inactive');
        }"
        :allow-empty="false"
        v-model="labelSettings.show_clock"
        @input="debouncedSetSettings"/>
    </div>
  </div>
  <div class="input-container select" v-if="labelSettings.show_count != null">
    <div class="input-label">
      <label>{{ $t('Show Count') }}</label>
    </div>
    <div class="input-wrapper">
      <multiselect
        :options="['always', 'active']"
        :custom-label="val => {
          return val === 'always' ?
            $t('Always, show 0 when inactive') :
            $t('Hide when inactive');
        }"
        :allow-empty="false"
        v-model="labelSettings.show_count"
        @input="debouncedSetSettings"/>
    </div>
  </div>
  <div class="input-container select" v-if="labelSettings.show_latest != null">
    <div class="input-label">
      <label>{{ $t('Show Latest') }}</label>
    </div>
    <div class="input-wrapper">
      <multiselect
        :options="['always', 'active']"
        :custom-label="val => {
          return val === 'always' ?
            $t('Always, show last person when inactive') :
            $t('Hide when inactive');
        }"
        :allow-empty="false"
        v-model="labelSettings.show_latest"
        @input="debouncedSetSettings"/>
    </div>
  </div>
  <div class="input-container" v-if="labelSettings.include_resubs != null">
    <div class="input-label">
    </div>
    <div class="input-wrapper">
      <div class="checkbox">
        <input
          type="checkbox"
          v-model="labelSettings.include_resubs"
          @change="debouncedSetSettings"/>
        <label>{{ $t('Include Resubs') }}</label>
      </div>
    </div>
  </div>
  <div class="input-container" v-if="labelSettings.format != null">
    <div class="input-label">
      <label>{{ $t('Preview') }}</label>
    </div>
    <div class="input-wrapper">
      <div class="streamlabel-preview">
        <div v-for="line in splitPreview" :key="line">
          {{ line }}
        </div>
      </div>
      <div>
        <b>{{ $t('Note:') }}</b>
        {{ $t('Actual label text may take up to 60 seconds to update') }}
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./StreamlabelProperties.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

.streamlabel-token {
  color: var(--teal);
}

.streamlabel-preview {
  color: var(--title);
}
</style>
