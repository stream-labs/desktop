<template>
  <div class="container">
    <div class="header">
      <div class="header-item">放送者NG設定</div>
      <div class="header-item"><i class="icon-close icon-btn" @click="close"></i></div>
    </div>
    <div class="content">
      <div class="content-header">
        <button type="button" @click="currentType = 'word'" class="choice" :class="{ active: currentType === 'word' }" >コメント</button>
        <button type="button" @click="currentType = 'user_id'" class="choice" :class="{ active: currentType === 'user_id' }" >ユーザーID</button>
        <button type="button" @click="currentType = 'command'" class="choice" :class="{ active: currentType === 'command' }" >コマンド</button>
        <div class="registrations">登録数 {{ count }}/500</div>
      </div>
      <form class="add-form" @submit.prevent="onAdd">
        <input type="text" v-model="newFilterValue" placeholder="NGコメントを入力" :disabled="adding" :readonly="adding" />
        <button type="submit" :disabled="adding">追加</button>
      </form>
      <div class="list">
        <div class="row" v-for="item of currentTypeFilters" :key="item.id">
          <div class="item-body" :title="item.body">{{ item.body }}</div>
          <button type="button" class="item-misc icon-btn icon-delete" :disabled="deleting" @click="deleteFilter(item)"></button>
        </div>
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

  display: flex;
  flex-direction: column;
}

.content-header {
  flex-shrink: 0;
  height: 40px;
  font-size: 12px;
  color: @light-grey;

  display: flex;

  > button {
    width: 80px;
    padding-top: 2px;
    border-bottom: 2px solid transparent;

    &:hover {
      color: @text-primary;
      border-bottom: 2px solid @text-primary;
    }
  }

  > .registrations {
    margin-left: auto;
    height: 40px;
    line-height: 40px;
  }
}

.add-form {
  flex-shrink: 0;

  display: flex;
  padding: 8px;

  > input {
    flex-grow: 1;
  }

  > button {
    flex-shrink: 0;
    width: 48px;
    border-radius: 2px;

    color: @white;
    background-color: @nicolive-button;

    &:hover {
      background-color: @nicolive-button-hover;
    }
  }
}

.list {
  flex-grow: 1;
  overflow-y: scroll;
}

.row {
  height: 32px;
  line-height: 32px;
  width: 100%;

  display: flex;
  flex-direction: row;

  &:hover .item-misc {
    display: flex;
  }
}

.item-body {
  margin-left: 16px;
  overflow-x: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex-grow: 1;
  color: @light-grey;
}

.item-misc {
  display: none;
  width: 32px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}
</style>
