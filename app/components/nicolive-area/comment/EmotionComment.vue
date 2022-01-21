<template>
  <div class="root" :class="chat.type" :title="computedTitle">
    <div class="comment-header"><i class="icon-emotion"></i></div>
    <div class="comment-body">{{ computedContent }}</div>
  </div>
</template>
<script lang="ts" src="./EmotionComment.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/_colors";
@import "../../../styles/mixins";
@import "./comment";

.root {
  display: flex;
  flex-direction: row;
}

.comment-header {
  .common__comment-header;

  > i {
    color: var(--color-brand-emotion);
  }
}

.comment-body {
  .common__comment-body;
  color: var(--color-text);

  [speaking=true] & {
    color: var(--color-text-active);
  }
}
</style>