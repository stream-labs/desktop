<template>
  <div class="container">
    <div class="header">
      <i class="icon-settings icon-btn"></i>
      <i class="icon-settings icon-btn"></i>
    </div>
    <div class="viewer">
      <div class="row" v-for="(item, index) of items" :key="index">
        <div class="comment-number">{{ item.chat.no }}</div>
        <div class="comment-body">{{ item.chat.content }}</div>
        <div class="comment-misc">…</div>
      </div>
    </div>
    <comment-form />
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

  background-color: @bg-secondary;
}

.viewer {
  flex-grow: 1;
}

.row {
  height: 36px;
  line-height: 36px;
  width: 100%;

  display: flex;
  flex-direction: row;
}

.comment-number {
  width: 48px;
  padding-right: 8px;
  text-align: right;
  flex-shrink: 0;
}

.comment-body {
  overflow-x: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  color: @white;
}

.comment-misc {
  width: 36px;
  flex-shrink: 0;
  text-align: center;
}
</style>
