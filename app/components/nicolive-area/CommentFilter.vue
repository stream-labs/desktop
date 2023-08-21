<template>
  <div class="container">
    <div class="header">
      <p class="header-title">放送者NG設定</p>
      <i class="icon-close icon-btn" @click="close"></i>
    </div>
    <div class="content">
      <div class="content-header">
        <button
          type="button"
          @click="currentType = 'word'"
          class="choice"
          :class="{ active: currentType === 'word' }"
        >
          コメント
        </button>
        <button
          type="button"
          @click="currentType = 'user'"
          class="choice"
          :class="{ active: currentType === 'user' }"
        >
          ユーザーID
        </button>
        <button
          type="button"
          @click="currentType = 'command'"
          class="choice"
          :class="{ active: currentType === 'command' }"
        >
          コマンド
        </button>
        <div class="registrations">登録数 {{ count }}/{{ maxCount }}</div>
      </div>
      <form class="add-form" @submit.prevent="onAdd">
        <input
          type="text"
          ref="input"
          v-model="newFilterValue"
          :placeholder="PLACEHOLDER[currentType]"
          :disabled="adding"
          :readonly="adding"
        />
        <button
          type="submit"
          :disabled="!newFilterValue || adding || invalid"
          class="button button--secondary"
        >
          追加
        </button>
      </form>
      <div class="floating-wrapper" v-if="invalid">
        このユーザーIDは存在しないか、無効な文字列です
      </div>
      <div class="list">
        <div class="row" v-for="item of currentTypeFilters" :key="item.id">
          <div class="item-box">
            <div class="item-body" :title="item.body">{{ item.body }}</div>
            <div class="item-comment" v-if="item.comment_body" :title="item.comment_body">
              {{ item.comment_body }}
            </div>
            <div class="item-date" :title="item.register_date">{{ item.register_date }}</div>
          </div>
          <button
            type="button"
            class="item-misc icon-btn icon-delete"
            :disabled="deleting"
            @click="deleteFilter(item)"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./CommentFilter.vue.ts"></script>
<style lang="less" scoped>
@import url('../../styles/index');

.container {
  display: flex;
  flex-basis: 0;
  flex-direction: column;
  flex-grow: 1;
  width: 100%;
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
    margin: 0;
    font-size: @font-size4;
    color: var(--color-text-light);
    text-align: center;
  }

  > .icon-close {
    position: absolute;
    right: 16px;
    display: flex;
    align-items: center;
  }
}

.content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.content-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  padding: 0 8px;
  margin-bottom: 8px;
  font-size: 12px;
  border-bottom: 1px solid @border;

  > button {
    position: relative;
    padding: 16px 8px;
    margin-right: 8px;
    font-size: 12px;
    color: var(--color-text);

    &::after {
      position: absolute;
      bottom: 0;
      left: 0;
      display: block;
      width: 100%;
      height: 2px;
      content: '';
      background-color: transparent;
    }

    &:hover {
      color: var(--color-text-light);
    }

    &.active {
      color: var(--color-text-active);

      &::after {
        background-color: var(--color-text-active);
      }
    }
  }

  > .registrations {
    margin-right: 8px;
    margin-left: auto;
    color: @light-grey;
  }
}

.add-form {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  padding: 8px;

  > input {
    box-sizing: border-box;
    flex-grow: 1;
    width: auto;
    padding-right: 36px;
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

.floating-wrapper {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: @z-index-default-content;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  pointer-events: none;
}

.list {
  flex-grow: 1;
  overflow-y: auto;
}

.row {
  display: flex;
  flex-direction: row;
  font-size: @font-size4;

  &:hover {
    .bg-hover();

    .item-misc {
      display: flex;
    }
  }
}

.item-box {
  .text-ellipsis;

  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin-top: 12px;
  margin-bottom: 12px;

  div {
    height: 24px;
    line-height: 24px;
  }
}

.item-body {
  margin-left: 16px;
  color: var(--color-text);
}

.item-comment {
  margin-left: 16px;
  color: var(--color-text-dark);
}

.item-date {
  flex-shrink: 0;
  margin-left: 16px;
  color: var(--color-text-dark);
}

.item-misc {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}
</style>
