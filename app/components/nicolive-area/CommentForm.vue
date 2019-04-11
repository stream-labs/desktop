<template>
  <div class="comment-form">
    <input type="text" :readonly="isCommentSending" :disabled="isCommentSending" placeholder="Ctrl+Enterで固定表示" v-model="operatorCommentValue" @keydown.enter="sendOperatorComment($event)" class="comment-input">
    <button type="submit" :disabled="isCommentSending" @click="sendOperatorComment($event)" class="button comment-button">コメント</button>
  </div>
</template>

<script lang="ts" src="./CommentForm.vue.ts"></script>
<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

.comment-form {
  display: flex;
  justify-content: center;
  padding: 8px;
  background-color: @bg-primary;
}

.comment-input {
  flex-grow: 1;
  width: auto;
  margin-right: 8px;
  background-color: @bg-secondary;
  border-radius: 4px;

  &::placeholder {
    color: @grey;
  }
}

.comment-button {
  padding: 0 8px;
  background-color: @nicolive-button;
  border-radius: 4px;

  &:hover {
    background-color: @nicolive-button-hover;
  }
}
</style>
