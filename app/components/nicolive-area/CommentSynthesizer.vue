<template>
  <div class="container">
    <div class="header">
      <div class="header-item-center">コメント読み上げ設定</div>
    </div>
    <div class="content">
      <div class="row">
        <div class="name">コメントを読み上げる</div>
        <div class="value"><input type="checkbox" v-model="enabled" class="toggle-button" /></div>
      </div>
      <div class="row">
        <div class="name">声の高さ(基本=1.0)</div>
        <div class="value"><VueSlider :disabled="!enabled" :data="pitchCandidates" :width="128" v-model="pitch" /></div>
      </div>
      <div class="row">
        <div class="name">読み上げ速度(基本=1.0)</div>
        <div class="value"><VueSlider :disabled="!enabled" :data="rateCandidates" :width="128" v-model="rate" /></div>
      </div>
      <div class="row">
        <div class="name">読み上げ音量(最大=1.0)</div>
        <div class="value"><VueSlider :disabled="!enabled" :data="volumeCandidates" :max="1" :width="128" v-model="volume" /></div>
      </div>
      <div class="row">
        <button class="button" :disabled="!enabled" @click="play">テスト再生</button>
        <button class="button" :disabled="!enabled" @click="reset">リセット</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./CommentSynthesizer.vue.ts"></script>
<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex-grow: 1;
  flex-basis: 0;
  overflow-y: auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  padding: 4px 16px;
  background-color: rgba(@black,.5);
  border-bottom: 1px solid rgba(@black,.5);

  > .header-item-center {
    font-size: 12px;
    color: @white;
    text-align: center;
  }

  > .header-item-right {
    display: flex;
    align-items: center;
    position: absolute;
    right: 16px;
  }
}

.content {
  flex-grow: 1;
  padding-top: 8px;
  background-color: rgba(@black,.5);
}

.row {
  width: 100%;
  padding: 16px;

  display: flex;
  flex-direction: row;
  align-items: center;
}

.name {
  font-size: 12px;
  color: @light-grey;
  flex-grow: 1;
}

.value {
  display: flex;
  align-items: center;
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
</style>

