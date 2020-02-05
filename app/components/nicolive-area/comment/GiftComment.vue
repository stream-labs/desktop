<template>
  <div class="root" :class="chat.type" :title="computedTitle">
    <div class="comment-header"><i class="icon-gift"></i></div>
    <div class="comment-body">{{ computedContent }}</div>
  </div>
</template>
<script lang="ts" src="./GiftComment.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/_colors";
@import "../../../styles/mixins";
@import "./comment";

.root {
  display: flex;
  flex-direction: row;
  .comment-row-fade(@gift-brand-color);
}

.comment-header {
  .common__comment-header();
  color: @gift-brand-color;
}

.comment-body {
  .common__comment-body();
  color: @light-grey;
}
</style>