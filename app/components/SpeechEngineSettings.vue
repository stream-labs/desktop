<template>
  <div class="setting-section">
    <div class="section">
      <div class="speech-engine-heading" data-type="nVoice">
        <p class="speech-engine-heading-label">N Voice</p>
        <span class="speech-engine-heading-text">テキスト</span>
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
          読み上げテスト
        </button>
      </div>
    </div>
    <div class="section">
      <div class="speech-engine-heading" data-type="windows">
        <p class="speech-engine-heading-label">Windows</p>
        <span class="speech-engine-heading-text">テキスト</span>
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
  border-radius: 4px 4px 0 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &:before {
    position: absolute;
    top: 0;
    left: 0;
    content: '';
    width: 100%;
    height: 100%;
    background: linear-gradient(270deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.25) 100%);
  }

  // キャラデザが決まるまでの暫定対応
  &[data-type="nVoice"] {
    background-color: var(--color-brand-nvoice);

    &:after {
      content: '';
      position: absolute;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      width: 100%;
      height: 100%;
      background: url(../../media/images/pulse.png) repeat-x right center/ 60px auto;
      opacity: .3;
    }
  }

  &[data-type="windows"] {
    background-color: var(--color-brand-windows);
  }
}

.speech-engine-heading-label {
  font-size: @font-size6;
  font-weight: @font-weight-bold;
  color: var(--color-text-light);
  margin: 0;
  z-index: 1;
}

.speech-engine-heading-text {
  font-size: @font-size2;
  color: var(--color-text-light);
  text-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25);
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

