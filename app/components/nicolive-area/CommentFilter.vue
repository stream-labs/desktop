<template>
  <div class="container">
    <div class="header">
      <div class="header-item">放送者NG設定</div>
      <div class="header-item"><i class="icon-close icon-btn" @click="close"></i></div>
    </div>
    <div class="content">
      <div class="content-header">
        <div class="choices">
          <div @click="currentType = 'word'" class="choice" :class="{ active: currentType === 'word' }" >コメント</div>
          <div @click="currentType = 'user_id'" class="choice" :class="{ active: currentType === 'user_id' }" >ユーザーID</div>
          <div @click="currentType = 'command'" class="choice" :class="{ active: currentType === 'command' }" >コマンド</div>
        </div>
        <div class="registrations">登録数 {{ count }}/500</div>
      </div>
      <div class="action-area">
        <div class="add-form">
          <input type="text" v-model="newFilterValue" />
          <i class="icon-plus icon-btn" @click="onAdd"></i>
        </div>
        <div class="delete-form">
          <button class="button button--default" @click="clearChecked">キャンセル</button>
          <button class="button button--action" @click="deleteFilters">削除</button>
        </div>
      </div>
      <div class="row" v-for="item of currentTypeFilters" :key="item.id">
        <input type="checkbox" :checked="hasChecked(item.id)" @change="updateChecked(item.id, $event.target.checked)"> {{ item.body }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./CommentFilter.vue.ts"></script>
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

  background-color: @bg-secondary;

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
}
</style>
