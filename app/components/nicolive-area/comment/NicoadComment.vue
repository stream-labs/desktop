<template>
  <div class="root" :class="chat.type">
    <div class="comment-header">広告</div>
    <div class="comment-body">{{ computedContent }}</div>
  </div>
</template>
<script lang="ts" src="./NicoadComment.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/_colors";
@import "../../../styles/mixins";

.root {
  display: flex;
  flex-direction: row;
}

.comment-header {
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
</style>
