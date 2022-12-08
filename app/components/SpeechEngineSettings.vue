<template>
  <div class="setting-section">
    <div class="section">
      <div class="speech-engine-heading" data-type="nVoice">
        <p class="speech-engine-heading-label">N Voice 琴詠ニア</p>
        <span class="speech-engine-heading-text">ニコニコから生まれた素直な声が特徴の音声合成エンジン</span>
      </div>
      <div class="input-label section-heading">
        <label>音声設定</label>
        <button class="button--text section-heading-button" :disabled="!enabled" @click="resetNVoice">
          設定リセット
        </button>
      </div>
      <div class="input-container">
        <div class="input-wrapper">
          <div class="row">
            <div class="name">合成音の最大秒数</div>
            <div class="value">
              {{ maxTime }}<span v-if="maxTime == maxTimeDefault">（既定）</span>
            </div>
          </div>
          <VueSlider
            class="slider"
            :disabled="!enabled"
            :data="maxTimeCandidates"
            :height="4"
            v-model="maxTime"
            tooltip="hover"
            :lazy="true"
          />
        </div>
        <button
          class="button button--secondary speech-button"
          :disabled="!enabled"
          @click="testSpeechPlay('nVoice')"
        >
          <i class="icon-speaker"></i>
          読み上げテスト
        </button>
      </div>
    </div>
    <div class="section">
      <div class="speech-engine-heading" data-type="windows">
        <p class="speech-engine-heading-label">Windowsの音声合成</p>
        <span class="speech-engine-heading-text">Windowsの設定で選択されている音声合成エンジン</span>
      </div>
      <div class="input-label section-heading">
        <label>音声設定</label>
        <button class="button--text section-heading-button" :disabled="!enabled" @click="resetWindows">
          設定リセット
        </button>
      </div>
      <div class="input-container">
        <div class="input-wrapper">
          <div class="row">
            <div class="name">声の高さ</div>
            <div class="value">{{ pitch }}<span v-if="pitch == pitchDefault">（既定）</span></div>
          </div>
          <VueSlider
            class="slider"
            :disabled="!enabled"
            :data="pitchCandidates"
            :height="4"
            v-model="pitch"
            tooltip="hover"
            :lazy="true"
          />
        </div>
        <button
          class="button button--secondary speech-button"
          :disabled="!enabled"
          @click="testSpeechPlay('webSpeech')"
        >
          <i class="icon-speaker"></i>
          読み上げテスト
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./SpeechEngineSettings.vue.ts"></script>
<style lang="less" scoped>
@import '../styles/index';

.speech-engine-heading {
  margin: -16px -16px 16px;
  padding: 16px;
  height: 80px;
  border-radius: 4px 4px 0 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px var(--color-border-light);

  &[data-type="windows"] {
    background: url(../../media/images/windows_bg.png) center no-repeat / 100% auto;
  }

  &[data-type="nVoice"] {
    background: url(../../media/images/nvoice_bg.png) center no-repeat / 100% auto;

    &:after {
      content: '';
      position: absolute;
      top: -59px;
      right: -46px;
      width: 432px;
      height: 433px;
      background: url(../../media/images/nvoice.png) no-repeat center/ 100% auto;
      opacity: .9;
      filter: drop-shadow(4px 4px 12px rgba(@black, 0.3));
    }
  }
}

.speech-engine-heading-label {
  font-size: @font-size4;
  font-weight: @font-weight-bold;
  color: var(--color-text-light);
  margin: 0 0 4px 0;
  z-index: 1;
}

.speech-engine-heading-text {
  font-size: @font-size2;
  color: var(--color-text-light);
  text-shadow: 0px 0px 4px rgba(@black, 0.25);
  z-index: 1;
}

.section-heading {
  display: flex;
  width: 100%;
}

.section-heading-button {
  margin-left: auto;
}

.row {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
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

.speech-button {
  width: 100%;
}
</style>

