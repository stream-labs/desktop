<template>
  <div class="root" :class="[chat.type, { pseudoHover: commentMenuOpened }]" :title="computedTitle" :speaking="speaking" @dblclick="$emit('pinned')">
    <div class="comment-number">{{ chat.value.no }}</div>
    <div class="comment-body">{{ computedContent }}</div>
    <div class="comment-misc" @click.stop="$emit('commentMenu')"><i class="icon-btn icon-ellipsis-vertical"></i></div>
  </div>
</template>
<script lang="ts" src="./CommonComment.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";
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
  .common__comment-number;
}

.comment-body {
  .common__comment-body;
    color: var(--color-text-light);

  .operator & {
    color: var(--color-accent);
  }

  [speaking=true] & {
    color: var(--color-text-active);
  }
}

.comment-misc {
  .common__comment-misc;
  display: none;
}

</style>
