<template>
  <div class="root comment-root" :class="chat.type" :title="computedTitle">
    <div class="comment-wrapper">
      <div class="comment-header"><i class="icon-emotion"></i></div>
      <div class="comment-body">{{ computedContent }}</div>
    </div>
  </div>
</template>
<script lang="ts" src="./EmotionComment.vue.ts"></script>

<style lang="less" scoped>
@import url('../../../styles/_colors');
@import url('../../../styles/mixins');
@import url('./comment');

.comment-root {
  .common__comment-root;
}

.comment-wrapper {
  .common__comment-wrapper;
}

.comment-header {
  .common__comment-header;

  > i {
    color: var(--color-brand-emotion);
  }
}

.comment-body {
  .common__comment-body;
  .text-ellipsis;

  color: var(--color-text);

  [speaking='true'] & {
    color: var(--color-text-active);
  }
}
</style>
