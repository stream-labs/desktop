<template>
  <div class="container">
    <div class="header">
      <p class="header-title">放送者NG設定</p>
      <i class="icon-close icon-btn" @click="close"></i>
    </div>
    <div class="content">
      <div class="content-header">
        <button type="button" @click="currentType = 'word'" class="choice" :class="{ active: currentType === 'word' }" >コメント</button>
        <button type="button" @click="currentType = 'user'" class="choice" :class="{ active: currentType === 'user' }" >ユーザーID</button>
        <button type="button" @click="currentType = 'command'" class="choice" :class="{ active: currentType === 'command' }" >コマンド</button>
        <div class="registrations">登録数 {{ count }}/{{ maxCount }}</div>
      </div>
      <form class="add-form" @submit.prevent="onAdd">
        <input type="text" ref="input" v-model="newFilterValue" :placeholder="`NGに登録する${FILTER_VALUE[currentType]}を入力`" :disabled="adding" :readonly="adding" />
        <button type="submit" :disabled="adding" class="button button--secondary">追加</button>
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
@import "../../styles/index";

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
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: 48px;
  padding: 4px 16px;
  border-bottom: 1px solid var(--color-border-light);

  > .header-title {
    font-size: @font-size4;
    color: var(--color-text-light);
    text-align: center;
    margin: 0;
  }

  > .icon-close {
    display: flex;
    align-items: center;
    position: absolute;
    right: 16px;
  }
}

.content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.content-header {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 12px;
  padding: 0 8px;
  border-bottom: 1px solid @border;
  margin-bottom: 8px;

  > button {
    font-size: 12px;
    color: var(--color-text);
    margin-right: 8px;
    padding: 16px 8px;
    position: relative;

    &:after {
      display: block;
      content: '';
      width: 100%;
      height: 2px;
      position: absolute;
      left: 0;
      bottom: 0;
      background-color: transparent;
    }

    &:hover {
      color: var(--color-text-light);
    }

    &.active {
      color: var(--color-text-active);

      &:after {
        background-color: var(--color-text-active);
      }
    }
  }

  > .registrations {
    color: @light-grey;
    margin-left: auto;
    margin-right: 8px;
  }
}

.add-form {
  display: flex;
  justify-content: center;
  padding: 8px;
  flex-shrink: 0;

  > input {
    flex-grow: 1;
    width: auto;
    padding-right: 36px;
    box-sizing: border-box;
    border-radius: 4px 0 0 4px;

    &::placeholder {
      color: var(--color-text-dark);
    }
  }

  > button {
    flex-shrink: 0;
    border-radius: 0 4px 4px 0;
  }
}

.list {
  flex-grow: 1;
  overflow-y: auto;
}

.row {
  font-size: @font-size4;
  height: 40px;
  line-height: 40px;

  display: flex;
  flex-direction: row;

  &:hover {
    .bg-hover();

    .item-misc {
      display: flex;
    }
  }
}

.item-body {
  .text-ellipsis;
  margin-left: 16px;
  flex-grow: 1;
  color: var(--color-text);
}

.item-misc {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}
</style>
