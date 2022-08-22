<template>
  <div class="setting-section">
    <div class="section-heading">コメント読み上げ設定</div>
    <div class="section-content">
      <div class="section-item">
        <div class="row">
          <div class="name">コメントを読み上げる</div>
          <div class="value"><input type="checkbox" v-model="enabled" class="toggle-button" /></div>
        </div>
      </div>
      <div class="section-item">
        <div class="row">
          <div class="name">声の高さ</div>
          <div class="value">{{ pitch }}<span v-if="pitch==1.0">（規定）</span></div>
        </div>
        <VueSlider class="slider" :disabled="!enabled" :data="pitchCandidates" :height="4" v-model="pitch" tooltip="hover" :lazy="true" /> 
      </div>
      <div class="section-item">
        <div class="row">
          <div class="name">速度</div>
          <div class="value">×{{ rate }}<span v-if="rate==1.0">（規定）</span></div>
        </div>
        <VueSlider class="slider" :disabled="!enabled" :data="rateCandidates" :height="4" v-model="rate" tooltip="hover" :lazy="true" />
      </div>
      <div class="section-item">
        <div class="row">
          <div class="name">音量</div>
          <div class="value">{{ volume }}<span v-if="volume==1.0">（規定）</span></div>
        </div>
        <VueSlider class="slider" :disabled="!enabled" :data="volumeCandidates" :height="4" :max="1" v-model="volume" tooltip="hover" :lazy="true" />
      </div>
      <div class="section-item">
        <div class="row">
          <button class="button button--primary" :disabled="!enabled" @click="testSpeechPlay">読み上げテスト</button>
          <button class="button button--secondary" :disabled="!enabled" @click="reset">リセット</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./CommentSynthesizer.vue.ts"></script>
<style lang="less" scoped>
@import "../../styles/index";

.section-heading {
  color: var(--color-text-light);
  padding: 16px 16px 0;
}

.section-item {
  padding: 16px;
}

.row {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.slider-wrapper {
  margin-bottom: 32px;
}

.name {
  font-size: @font-size4;
  color: var(--color-text);
  flex-grow: 1;
}

.value {
  display: flex;
  align-items: center;
  color: var(--color-text);
}

.slider {
  margin-top: 16px;
}

.nl-select {
  font-size: 12px;
  color: @white;
  min-width: 80px;
  height: 32px;
  line-height: 32px;
  margin: 0;
  padding: 0 24px 0 8px;
  background-color: @bg-primary;
  border-color: transparent;
  outline: none;
  cursor: pointer;

  &:focus {
    border: 1px solid @text-primary;
  }
}

.button {
  & + & {
    margin-left: 8px;
  }
}
</style>

