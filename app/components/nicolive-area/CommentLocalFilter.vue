<template>
  <div class="container">
    <div class="header">
      <div class="header-item">フィルター設定</div>
      <div class="header-item"><i class="icon-close icon-btn" @click="close"></i></div>
    </div>
    <div class="content">
      <div class="row">
        <div class="name">匿名(184)のコメントを表示</div>
        <div class="value"><input type="checkbox" v-model="showAnonymous" class="toggle-button" /></div>
      </div>
      <div class="row">
        <div class="name">NG共有設定</div>
        <div class="value">
          <select v-model="level">
            <option v-for="lv in NG_SHARING_LEVELS" :key="lv" :value="lv" :label="lv" :selected="lv === level"></option>
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
  background-color: @bg-tertiary;
}

.header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  height: 40px;
  line-height: 40px;

  padding-right: 16px;

  background-color: @bg-quinary;

  & > .header-item {
    color: @white;
    margin: 4px;
    height: 32px;
    line-height: 32px;
  }
}

.content {
  flex-grow: 1;
}

.row {
  height: 36px;
  line-height: 36px;
  width: 100%;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.name {
  flex-grow: 1;
}
</style>
