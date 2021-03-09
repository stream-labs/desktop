<template>
  <div class="container">
    <div class="header">
      <div class="header-item-center">コメント読み上げ設定</div>
      <div class="header-item-right"><i class="icon-close icon-btn" @click="close"></i></div>
    </div>
    <div class="content">
      <div class="row">
        <div class="name">コメントを読み上げる</div>
        <div class="value"><input type="checkbox" v-model="enabled" class="toggle-button" /></div>
      </div>
      <div class="row">
        <div class="name">声の高さ(基本=1.0)</div>
        <div class="value"><VueSlider
          :data="[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2]"
          :width="128" v-model="pitch" /></div>
      </div>
      <div class="row">
        <div class="name">読み上げ速度(基本=1.0)</div>
        <div class="value"><VueSlider
          :data="[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5, 1.75, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
          :width="128" v-model="rate" /></div>
      </div>
      <div class="row">
          <button type="button" class="item-misc icon-btn icon-play" @click="play">テスト再生</button>
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

