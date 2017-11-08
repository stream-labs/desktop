<template>
<div>
  <div class="input-container select">
    <div class="input-label">
      <label>Label Type</label>
    </div>
    <div class="input-wrapper">
      <multiselect
        :options="statOptions"
        group-label="label"
        group-values="files"
        track-by="name"
        label="label"
        :value="currentlySelected"
        @input="handleInput"/>
    </div>
  </div>
  <div class="input-container">
    <div class="input-label">
      <label>Label Template</label>
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
      <label>Item Template</label>
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
      <label>Item Separator</label>
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
      <label>Item Limit</label>
    </div>
    <div class="input-wrapper">
      <input
        type="text"
        v-model="labelSettings.limit"
        @input="debouncedSetSettings"/>
    </div>
  </div>
  <div class="input-container">
    <div class="input-label">
      <label>Preview</label>
    </div>
    <div class="input-wrapper">
      <div class="streamlabel-preview">
        {{ preview }}
      </div>
      <div>
        <b>Note:</b>
        Actual label text may take up to 60 seconds to update
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./StreamlabelProperties.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

.streamlabel-token {
  color: @teal;
}

.streamlabel-preview {
  color: @black;
}

.night-theme {
  .streamlabel-preview {
    color: @white;
  }
}
</style>
