<template>
  <div
    class="root"
    :class="[chat.type, { pseudoHover: commentMenuOpened }]"
    :title="computedTitle"
    :speaking="speaking"
    @dblclick="$emit('pinned')"
  >
    <div class="comment-root">
      <div class="comment-number">{{ chat.value.no }}</div>
      <div class="comment-box">
        <div class="comment-name-box" v-if="chat.value.name" @click.stop="$emit('commentUser')">
          <img class="comment-icon" :src="userIconURL" />
          <div class="comment-name">{{ chat.value.name }}</div>
        </div>
        <div class="comment-body">{{ computedContent }}</div>
      </div>
      <div class="comment-misc" @click.stop="$emit('commentMenu')">
        <i class="icon-btn icon-ellipsis-vertical"></i>
      </div>
    </div>
    <div class="nameplate-hint" v-if="nameplateHint">
      <div>[なふだ機能]を使ったコメントが投稿されました</div>
      <div>ニックネームをクリックして、視聴者のことをもっとよく知ってみよう!</div>
      <div>
        <a
          @click.prevent="openInDefaultBrowser($event)"
          href="https://qa.nicovideo.jp/faq/show/21148?site_domain=default"
          class="link"
          >なふだ機能とは?</a
        >
      </div>
    </div>
  </div>
</template>
<script lang="ts" src="./CommonComment.vue.ts"></script>

<style lang="less" scoped>
@import url('../../../styles/index');
@import url('./comment');

.root {
  display: flex;
  flex-direction: column;
}

.comment-root {
  display: flex;
  flex: 1;
  flex-direction: row;

  &:hover,
  &.pseudoHover {
    .bg-hover();

    & > .comment-misc {
      display: block;
    }
  }
}

.comment-number {
  .common__comment-number;
}

.comment-box {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.comment-name-box {
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  margin-left: 16px;
}

.comment-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
}

.comment-name {
  color: var(--color-text-light);
}

.comment-body {
  .common__comment-body;

  flex: 1;
  color: var(--color-text-light);

  .operator & {
    color: var(--color-accent);
  }

  [speaking='true'] & {
    color: var(--color-text-active);
  }
}

.comment-misc {
  .common__comment-misc;

  display: none;
}

.nameplate-hint {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-right: 8px;
  padding-left: 8px;
  margin-left: 16px;
  background-color: var(--color-bg-secondary);
}

.nameplate-hint div {
  flex: 1;
}
</style>
