<template>
  <modal-layout :showControls="false">
    <div class="user-info" slot="content">
      <div class="user-detail">
        <div class="user-detail-left">
          <a class="user-page-link" @click="openUserPage" :title="userName">
            <img
              :src="userIconURL"
              width="32"
              height="32"
              class="user-icon"
              :alt="userName"
              @error.once="userIconURL = defaultUserIconURL"
            />
          </a>
        </div>
        <div class="user-detail-body">
          <a class="user-page-link" @click="openUserPage" :title="userName">
            <div class="user-name">{{ userName }}</div>
          </a>
          <div class="user-account">
            <p class="user-id">ID: {{ userId }}</p>
            <p class="user-type" :class="{ 'is-premium': isPremium }">
              {{ isPremium ? 'プレミアム会員' : '一般会員' }}
            </p>
          </div>
        </div>
        <div class="user-detail-right">
          <button class="button button--secondary" v-if="isFollowing" @click.stop="unFollowUser">
            <i class="icon-check"></i>フォロー中
          </button>
          <button class="button button--primary" v-else @click.stop="followUser">
            <i class="icon-follow"></i>フォロー
          </button>
        </div>
      </div>
      <div class="tag-list">
        <div class="tag-list-header">好きなものリスト ({{ konomiTags.length }})</div>
        <div class="tag-list-body">
          <div
            v-for="tag in konomiTags"
            :key="tag.name"
            :class="{ tagname: true, common: tag.common }"
          >
            {{ tag.name }}
          </div>
        </div>
      </div>
      <div class="comment-list">
        <div class="comment-list-header">直近のコメント一覧</div>
        <div class="comment-list-body" ref="scroll">
          <div class="list">
            <component
              class="comment-readonly"
              v-for="item of comments"
              :key="item.seqId"
              :is="componentMap[item.component]"
              :chat="item"
              :getFormattedLiveTime="getFormattedLiveTime"
            />
            <div class="sentinel" ref="sentinel"></div>
          </div>
          <div class="floating-wrapper">
            <button
              type="button"
              @click="scrollToLatest"
              class="scroll-to-latest button--tertiary"
              v-if="!isLatestVisible && comments.length > 0"
            >
              <i class="icon-down-arrow"></i>最新のコメントへ移動
            </button>
          </div>
        </div>
      </div>
    </div>
  </modal-layout>
</template>

<script lang="ts" src="./UserInfo.vue.ts"></script>

<style lang="less" scoped>
@import url('../../styles/index');

.user-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
}

.user-page-link {
  text-decoration: none;
}

.user-icon {
  width: 48px;
  height: 48px;
  border-radius: 9999px;
}

.user-name {
  font-size: @font-size5;
  font-weight: @font-weight-bold;
  color: var(--color-text-light);
  .text-ellipsis;

  .user-detail:hover & {
    color: var(--color-text-active);
  }
}

.user-account {
  display: flex;
}

.user-id {
  margin: 0;
  font-size: @font-size2;
  color: var(--color-text);
}

.user-type {
  margin: 0 0 0 8px;
  font-size: @font-size2;
  color: var(--color-text);

  &.is-premium {
    color: @niconico-premium-color;
  }
}

.user-detail {
  display: flex;
  align-items: center;
  padding: 0 8px 16px;
}

.user-detail-left {
  flex-shrink: 0;
}

.user-detail-body {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
  margin-left: 12px;
}

.user-detail-right {
  flex-shrink: 0;
  margin-left: 16px;
}

.tag-list {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 120px; // 3段目がちら見えする高さ
  max-height: 176px; // 5段目がちら見えする高さ
  margin-bottom: 16px;
  overflow: hidden;
  background-color: var(--color-bg-secondary);
}

.tag-list-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  height: 40px;
  padding: 8px 16px;
  font-size: @font-size4;
  font-weight: @font-weight-bold;
  color: var(--color-text-light);
  border-bottom: 1px solid var(--color-border-light);
}

.tag-list-body {
  display: flex;
  flex-grow: 1;
  flex-wrap: wrap;
  min-height: 54px;
  padding: 16px 8px 8px 16px;
  overflow: auto;

  &:empty {
    &::before {
      font-size: @font-size2;
      color: var(--color-text-dark);
      content: '設定されていません';
    }
  }
}

.tagname {
  padding: 0 8px;
  margin: 0 8px 8px 0;
  font-size: @font-size2;
  line-height: 20px;
  color: var(--color-text-light);
  background-color: var(--color-bg-primary);
  border-radius: 9999px;

  &.common {
    color: var(--color-text-active);
    background-color: var(--color-bg-quaternary);
  }
}

.comment-list {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
  background-color: var(--color-bg-secondary);
}

.comment-list-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  height: 40px;
  padding: 8px 16px;
  font-size: @font-size4;
  font-weight: @font-weight-bold;
  color: var(--color-text-light);
  border-bottom: 1px solid var(--color-border-light);
}

.comment-list-body {
  position: relative;
  display: flex;
  flex-grow: 1;
  flex-wrap: wrap;
  overflow: auto;
}

.list {
  flex-grow: 1;
  padding-top: 8px;
  overflow-x: hidden;
  overflow-y: auto;

  &:empty {
    &::before {
      font-size: @font-size2;
      color: var(--color-text-dark);
      content: 'コメントが取得できませんでした';
    }
  }
}

.sentinel {
  height: 4px;
  margin-top: -4px;
  pointer-events: none;
}

.floating-wrapper {
  position: fixed;
  right: 0;
  bottom: 16px;
  left: 0;
  z-index: @z-index-default-content;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  pointer-events: none;

  button {
    margin: 0 8px;
    pointer-events: auto;
  }
}

.scroll-to-latest {
  .transition;

  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 16px;
  font-size: @font-size2;
  line-height: 32px;
  color: var(--color-button-label);
  text-align: center;
  cursor: pointer;
  border-radius: 16px;

  > i {
    margin-right: 8px;
    font-size: @font-size1;
  }
}
</style>
