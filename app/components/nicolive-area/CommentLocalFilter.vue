<template>
  <div class="container">
    <div class="header">
      <div class="header-item-center">フィルター設定</div>
      <div class="header-item-right"><i class="icon-close icon-btn" @click="close"></i></div>
    </div>
    <div class="content">
      <div class="row">
        <div class="name">匿名(184)のコメントを表示</div>
        <div class="value"><input type="checkbox" v-model="showAnonymous" class="toggle-button" /></div>
      </div>
      <div class="row">
        <div class="name">NG共有設定</div>
        <div class="value">
          <select v-model="level" class="nl-select">
            <option v-for="lv in NG_SHARING_LEVELS" :key="lv" :value="lv" :label="NG_SHARING_LEVEL_LABELS[lv]" :selected="lv === level"></option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./CommentLocalFilter.vue.ts"></script>
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
