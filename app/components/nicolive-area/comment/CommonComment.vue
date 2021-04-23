<template>
  <div class="root" :class="[chat.type, { pseudoHover: commentMenuOpened }]" :title="computedTitle" :speaking="speaking" @dblclick="$emit('pinned')">
    <div class="comment-number">{{ chat.value.no }}</div>
    <div class="comment-body">{{ computedContent }}</div>
    <div class="comment-misc" @click.stop="$emit('commentMenu')"><i class="icon-btn icon-ellipsis-vertical"></i></div>
  </div>
</template>
<script lang="ts" src="./CommonComment.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/_colors";
@import "../../../styles/mixins";
@import "./comment";

.root {
  display: flex;
  flex-direction: row;

  &:hover, &.pseudoHover {
    .bg-hover();
    & > .comment-misc {
      display: block;
    }
  }
}

.comment-number {
  .common__comment-number();
  color: @grey;

  [speaking=true] & {
    color: @text-primary;
  }
}

.comment-body {
  .common__comment-body();
  color: @white;

  .operator & {
    color: @accent;
  }

  [speaking=true] & {
    color: @text-primary;
  }
}

.comment-misc {
  .common__comment-misc();
  display: none;
}

</style>
