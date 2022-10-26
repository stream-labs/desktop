<template>
  <div class="setting-section">
    <div class="section-heading">フィルター設定</div>
    <div class="section-content">
      <div class="section-item">
        <div class="row">
          <div class="name">匿名(184)のコメントを表示</div>
          <div class="value">
            <input type="checkbox" v-model="showAnonymous" class="toggle-button" />
          </div>
        </div>
      </div>
    </div>
    <div class="section-heading">音声設定</div>
    <button class="button button--secondary" :disabled="!enabled" @click="resetVoice">
      設定をリセット
    </button>
    <div class="section-content">
      <div class="section-item">
        <div class="row">
          <div class="name">コメントを読み上げる</div>
          <div class="value"><input type="checkbox" v-model="enabled" class="toggle-button" /></div>
        </div>
      </div>
      <div class="section-item">
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
      <div class="section-item">
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
    <div class="section-heading">振り分け設定</div>
    <button class="button button--secondary" :disabled="!enabled" @click="resetAssignment">
      設定をリセット
    </button>
    <div class="section-content">
      <div class="section-item">
        <label for="normal-select">視聴者コメント</label>
        <button class="button button--primary" :disabled="!enabled" @click="testSpeechPlay(normal)">
          読み上げテスト
        </button>
        <multiselect
          id="normal-select"
          :value="normal"
          :options="synthIds"
          :allow-empty="false"
          :custom-label="synthName"
          :placeholder="$t('settings.listPlaceholder')"
        >
          <template slot="option" slot-scope="o">
            {{ synthName(o.option) }}<span v-if="o.option == normalDefault">（既定）</span>
          </template>
        </multiselect>
      </div>

      <div class="section-item">
        <label for="operator-select">放送者コメント</label>
        <button
          class="button button--primary"
          :disabled="!enabled"
          @click="testSpeechPlay(operator)"
        >
          読み上げテスト
        </button>
        <multiselect
          id="operator-select"
          :value="operator"
          :options="synthIds"
          :allow-empty="false"
          :custom-label="synthName"
          :placeholder="$t('settings.listPlaceholder')"
        >
          <template slot="option" slot-scope="o">
            {{ synthName(o.option) }}<span v-if="o.option == operatorDefault">（既定）</span>
          </template>
        </multiselect>
      </div>

      <div class="section-item">
        <label for="system-select">システムメッセージ</label>
        <button class="button button--primary" :disabled="!enabled" @click="testSpeechPlay(system)">
          読み上げテスト
        </button>
        <multiselect
          id="system-select"
          :value="system"
          :options="synthIds"
          :allow-empty="false"
          :custom-label="synthName"
          :placeholder="$t('settings.listPlaceholder')"
        >
          <template slot="option" slot-scope="o">
            {{ synthName(o.option) }}<span v-if="o.option == operatorDefault">（既定）</span>
          </template>
        </multiselect>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./CommentSettings.vue.ts"></script>
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

