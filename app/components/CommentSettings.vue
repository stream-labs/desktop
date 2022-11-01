<template>
  <div class="setting-section">
    <div class="section">
        <div class="input-label section-heading">
          <label>フィルター設定</label>
        </div>
        <div class="input-container">
          <div class="input-wrapper">
            <div class="row">
              <div class="name">匿名(184)のコメントを表示</div>
              <div class="value">
                <input type="checkbox" v-model="showAnonymous" class="toggle-button" />
              </div>
            </div>
          </div>
        </div>
    </div>
    <div class="section">
      <div class="input-label section-heading">
        <label>コメント読み上げ設定</label>
      </div>
      <div class="input-container">
        <div class="input-wrapper">
          <div class="row">
            <div class="name">コメントを読み上げる</div>
            <div class="value"><input type="checkbox" v-model="enabled" class="toggle-button" /></div>
          </div>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="input-label section-heading">
        <label>音声設定</label>
        <button class="button--text section-heading-button" :disabled="!enabled" @click="resetVoice">
          設定リセット
        </button>
      </div>
      <div class="input-container">
        <div class="input-wrapper">
          <div class="row">
            <div class="name">速度</div>
            <div class="value">×{{ rate }}<span v-if="rate == rateDefault">（既定）</span></div>
          </div>
          <VueSlider
            class="slider"
            :disabled="!enabled"
            :data="rateCandidates"
            :height="4"
            v-model="rate"
            tooltip="hover"
            :lazy="true"
          />
        </div>
        <div class="input-wrapper">
          <div class="row">
            <div class="name">音量</div>
            <div class="value">{{ volume }}<span v-if="volume == volumeDefault">（既定）</span></div>
          </div>
          <VueSlider
            class="slider"
            :disabled="!enabled"
            :data="volumeCandidates"
            :height="4"
            :max="1"
            v-model="volume"
            tooltip="hover"
            :lazy="true"
          />
        </div>
      </div>
    </div>
    <div class="section">
      <div class="input-label section-heading">
        <label>振り分け設定</label>
        <button class="button--text section-heading-button" :disabled="!enabled" @click="resetAssignment">
          設定リセット
        </button>
      </div>
      <div class="input-container">
        <div class="input-wrapper">
          <div class="row input-heading">
            <label for="system-select">システムメッセージ</label>
            <button class="button button--secondary" :disabled="!enabled" @click="testSpeechPlay(system)">
              読み上げテスト
            </button>
          </div>
          <multiselect
            id="system-select"
            v-model="system"
            :options="synthIds"
            :allow-empty="false"
            :custom-label="synthName"
            :placeholder="$t('settings.listPlaceholder')"
            :data-type="system"
          >
            <template slot="option" slot-scope="o">
              {{ synthName(o.option) }}<span v-if="o.option == operatorDefault">（既定）</span>
            </template>
          </multiselect>
        </div>
      </div>
      <div class="input-container">
        <div class="input-wrapper">
          <div class="row input-heading">
            <label for="normal-select">視聴者コメント</label>
            <button class="button button--secondary" :disabled="!enabled" @click="testSpeechPlay(normal)">
              読み上げテスト
            </button>
          </div>
          <multiselect
            id="normal-select"
            v-model="normal"
            :options="synthIds"
            :allow-empty="false"
            :custom-label="synthName"
            :placeholder="$t('settings.listPlaceholder')"
            :data-type="normal"
          >
            <template slot="option" slot-scope="o">
              {{ synthName(o.option) }}<span v-if="o.option == normalDefault">（既定）</span>
            </template>
          </multiselect>
        </div>
      </div>
      <div class="input-container">
        <div class="input-wrapper">
          <div class="row input-heading">
            <label for="operator-select">放送者コメント</label>
            <button
              class="button button--secondary"
              :disabled="!enabled"
              @click="testSpeechPlay(operator)"
            >
              読み上げテスト
            </button>
          </div>
          <multiselect
            id="operator-select"
            v-model="operator"
            :options="synthIds"
            :allow-empty="false"
            :custom-label="synthName"
            :placeholder="$t('settings.listPlaceholder')"
            :data-type="operator"
          >
            <template slot="option" slot-scope="o">
              {{ synthName(o.option) }}<span v-if="o.option == operatorDefault">（既定）</span>
            </template>
          </multiselect>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./CommentSettings.vue.ts"></script>
<style lang="less" scoped>
@import '../styles/index';

select {
  margin: 0;
}

.section-heading {
  display: flex;
  width: 100%;
}

.section-heading-button {
  margin-left: auto;
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

.input-heading {
  margin-bottom: 16px;

  .button {
    margin-bottom: 0;
    margin-left: auto;
  };
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

.multiselect {
  height: 64px;
}

& /deep/ .multiselect__tags {
  height: 100%;

  [data-type="webSpeech"] & {
    background-color: var(--color-brand-windows);
  }

  // キャラデザが決まるまでの暫定対応
  [data-type="nVoice"] & {
    background: url(../../media/images/denpa.png) var(--color-brand-nvoice) right center no-repeat / 200px auto;
  }
}

& /deep/ .multiselect__select {
  line-height: 64px;

  &:before {
    right: 16px;
    color: var(--color-text-light);
  }
}

& /deep/ .multiselect__input {
  height: 64px;
  padding: 0 16px;
  font-weight: @font-weight-bold;
  color: var(--color-text-light);
  background: linear-gradient(270deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.25) 100%);
  text-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25);

  &:hover {
    border-color: var(--color-border-light);
  }
}

& /deep/ .multiselect__content {
  top: 8px;
}
</style>

