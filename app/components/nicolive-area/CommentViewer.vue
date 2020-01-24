<template>
  <div class="container">
    <div class="header">
      <i class="icon-settings icon-btn" @click="isFilterOpened = true"></i>
      <i class="icon-settings icon-btn" @click="isLocalFilterOpened = true"></i>
    </div>
    <div class="content">
      <div class="list">
        <div class="row" v-for="(item, index) of items" :key="index" @dblclick="pinnedComment = item" :title="itemToString(item)">
          <!-- TODO: 種別判定と出し分け -->
          <div class="comment-number">{{ item.no }}</div>
          <div class="comment-body">{{ item.content }}</div>
          <div class="comment-misc" @click.stop="showCommentMenu(item)">…</div>
        </div>
        <div class="sentinel" ref="sentinel"></div>
      </div>
      <div class="pinned" v-if="Boolean(pinnedComment)">
        <div class="comment-body">
          <div class="comment-number">{{ pinnedComment.no }}</div>
          {{ itemToString(pinnedComment) }}
        </div>
        <div class="close"><i class="icon-close icon-btn" @click="pinnedComment = null"></i></div>
      </div>
      <div class="scroll-to-latest" v-if="!isLatestVisible && items.length > 0">↓</div>
    </div>
    <comment-form class="comment-form" />
    <comment-filter class="overlay" @close="isFilterOpened = false" v-if="isFilterOpened"/>
    <comment-local-filter class="overlay" @close="isLocalFilterOpened = false" v-if="isLocalFilterOpened" />
  </div>
</template>

<script lang="ts" src="./CommentViewer.vue.ts"></script>
<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

.container {
  width: 100%;
  flex-grow: 1;
  background-color: @bg-tertiary;

  display: flex;
}

.header {
  flex-shrink: 0;
  height: 40px;
  line-height: 40px;
  text-align: right;

  padding-right: 16px;

  background-color: @bg-quinary;
}

.content {
  flex-grow: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

.list {
  flex-grow: 1;
  overflow-y: scroll;
}

.row {
  height: 36px;
  line-height: 36px;
  width: 100%;

  display: flex;
  flex-direction: row;

  & > .comment-number {
    width: 48px;
    padding-right: 8px;
    text-align: right;
    flex-shrink: 0;
  }

  & > .comment-body {
    overflow-x: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex-grow: 1;
    color: @white;
  }

  & > .comment-misc {
    width: 36px;
    flex-shrink: 0;
    text-align: center;
  }
}

.sentinel {
  pointer-events: none;
  height: 4px;
  margin-top: -4px;
}

.pinned {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  background-color: @bg-quinary;

  display: flex;

  & > .comment-body {
    color: @white;
    margin: 16px;
    flex-grow: 1;
    word-break: break-word;
  }

& > .close {
    margin: 16px;
    flex-shrink: 0;

    display: flex;
    align-items: center;

    & > .icon-btn {
      margin: 0;
    }
  }
}

.scroll-to-latest {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 10px auto;
  width: 36px;
  height: 36px;
  border-radius: 36px;
  line-height: 36px;
  text-align: center;
  background-color: @nicolive-button;
  color: @white;
}

.comment-form {
  flex-shrink: 0;
}

.overlay {
  z-index: 2; // AreaSwitcherのheaderより大きく
  position: absolute;
  height: 100%;
}
</style>
