<template>
  <div class="container">
    <div class="header">
      <p class="header-title">放送者NG設定</p>
      <span class="registrations">（登録数 {{ count }}/{{ maxCount }}）</span>
      <i class="icon-close icon-btn" @click="close"></i>
    </div>
    <div class="content">
      <div class="content-header">
        <button
          type="button"
          @click="currentType = 'word'"
          class="button--tab"
          :class="{ active: currentType === 'word' }"
        >
          コメント
        </button>
        <button
          type="button"
          @click="currentType = 'user'"
          class="button--tab"
          :class="{ active: currentType === 'user' }"
        >
          ユーザーID
        </button>
        <button
          type="button"
          @click="currentType = 'command'"
          class="button--tab"
          :class="{ active: currentType === 'command' }"
        >
          コマンド
        </button>
      </div>
      <form class="add-form" @submit.prevent="onAdd">
        <input
          type="text"
          ref="input"
          v-model="newFilterValue"
          :placeholder="PLACEHOLDER[currentType]"
          :disabled="adding"
          :readonly="adding"
          :class="{ 'is-error': invalid }"
        />
        <button
          type="submit"
          :disabled="!newFilterValue || adding || invalid"
          class="button button--secondary"
        >
          登録
        </button>
        <div class="form-tip floating-wrapper" v-if="invalid">数字以外の文字列は登録できません</div>
      </form>
      <div class="list">
        <div class="item row" v-for="item of currentTypeFilters" :key="item.id">
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
      <banner
        class="banner"
        title="匿名ユーザーによるNG登録についても、無期限に登録されるようになりました"
        body=""
        anchorLabel="詳細はこちら"
        anchorLink="https://blog.nicovideo.jp/niconews/205517.html"
        @close="isBannerOpened = false"
        v-if="isBannerOpened"
      >
      </banner>
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
  color: var(--color-text-light);
  .bold;

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
  height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid @border;

  > button {
    flex-grow: 1;
    height: 100%;
  }
}

.add-form {
  position: relative;
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  height: 72px;
  padding: 16px;
  border-bottom: 1px solid var(--color-border-light);

  > input {
    box-sizing: border-box;
    flex-grow: 1;
    width: auto;
    height: 100%;
    padding: 0 12px;
    border-radius: 4px 0 0 4px;

    &::placeholder {
      color: var(--color-text-dark);
    }
  }

  > button {
    flex-shrink: 0;
    height: 100%;
    border-radius: 0 4px 4px 0;
  }
}

.floating-wrapper {
  position: absolute;
  top: 64px;
  right: 0;
  left: 16px;
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

.item {
  padding: 12px 16px;
}

.item-box {
  .text-ellipsis;

  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.item-body {
  color: var(--color-text);
}

.item-comment {
  font-size: @font-size2;
  color: var(--color-text-dark);
}

.item-date {
  flex-shrink: 0;
  font-size: @font-size2;
  color: var(--color-text-dark);
}

.item-misc {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.banner {
  position: absolute;
  right: 16px;
  bottom: 16px;
  left: 16px;
  .shadow;
}
</style>
