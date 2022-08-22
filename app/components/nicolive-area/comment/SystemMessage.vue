<template>
  <div class="root" :class="chat.type" :title="computedTitle">
    <div class="comment-body">{{ computedContent }}</div>
  </div>
</template>
<script lang="ts" src="./SystemMessage.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/_colors";
@import "../../../styles/mixins";
@import "./comment";

.root {
  display: flex;
  flex-direction: row;
}

.comment-body {
  .common__comment-body;
  color: var(--color-text);
}
</style>