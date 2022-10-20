<template>
  <div class="setting-section">
    <h2>N Voice</h2>

    <div class="section-heading">音声設定</div>
    <button class="button button--secondary" :disabled="!enabled" @click="resetNVoice">
      設定をリセット
    </button>
    <div class="section-content">
      <div class="section-item">
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
      <div class="section-item">
        <div class="row">
          <button
            class="button button--primary"
            :disabled="!enabled"
            @click="testSpeechPlay('nVoice')"
          >
            読み上げテスト
          </button>
        </div>
      </div>
    </div>

    <h2>Windows</h2>

    <div class="section-heading">音声設定</div>
    <button class="button button--secondary" :disabled="!enabled" @click="resetWindows">
      設定をリセット
    </button>
    <div class="section-content">
      <div class="section-item">
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
      <div class="section-item">
        <div class="row">
          <button
            class="button button--primary"
            :disabled="!enabled"
            @click="testSpeechPlay('webSpeech')"
          >
            読み上げテスト
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./SpeechEngineSettings.vue.ts"></script>
<style lang="less" scoped>
@import '../styles/index';

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

.button {
  & + & {
    margin-left: 8px;
  }
}
</style>

