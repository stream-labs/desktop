<template>
  <div class="root comment-root" :class="chat.type" :title="computedTitle">
    <div class="comment-wrapper">
      <div class="comment-body">{{ computedContent }}</div>
    </div>
  </div>
</template>
<script lang="ts" src="./SystemMessage.vue.ts"></script>

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

.comment-body {
  .common__comment-body;

  color: var(--color-text-dark);
}
</style>
