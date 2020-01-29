<template>
  <div class="root" :class="[chat.type, { pseudoHover: commentMenuOpened }]" @dblclick="$emit('pinned')">
    <div class="comment-number">{{ chat.value.no }}</div>
    <div class="comment-body">{{ computedContent }}</div>
    <div class="comment-misc" @click.stop="$emit('commentMenu')"><i class="icon-btn icon-ellipsis-vertical"></i></div>
  </div>
</template>
<script lang="ts" src="./CommonComment.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/_colors";
@import "../../../styles/mixins";

.root {
  display: flex;
  flex-direction: row;

  &:hover, &.pseudoHover {
    background-color: @hover;

    & > .comment-body {
      color: @white;
    }

    & > .comment-misc {
      display: flex;
      align-items: center;
      padding-left: 8px;
      color: @light-grey;
    }
  }

  &.operator > .comment-body {
    color: @accent;
  }
}

.comment-number {
  min-width: 40px;
  padding-left: 16px;
  text-align: right;
  flex-shrink: 0;
  box-sizing: border-box;
  color: @grey;
}

.comment-body {
  margin-left: 16px;
  overflow-x: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex-grow: 1;
  color: @light-grey;
}

.comment-misc {
  display: none;
  width: 32px;
  flex-shrink: 0;
  text-align: center;
}
</style>
