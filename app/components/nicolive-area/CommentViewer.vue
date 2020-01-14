<template>
  <div class="container">
    <div class="header">
      <i class="icon-settings icon-btn" @click="isFilterOpened = true"></i>
      <i class="icon-settings icon-btn" @click="isLocalFilterOpened = true"></i>
    </div>
    <div class="content">
      <div class="row" v-for="(item, index) of items" :key="index">
        <!-- TODO: 種別判定と出し分け -->
        <div class="comment-number">{{ item.chat.no }}</div>
        <div class="comment-body">{{ item.chat.content }}</div>
        <div class="comment-misc">…</div>
      </div>
    </div>
    <comment-form />
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

  background-color: @bg-secondary;
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

.overlay {
  z-index: 2; // AreaSwitcherのheaderより大きく
  position: absolute;
  height: 100%;
}
</style>
