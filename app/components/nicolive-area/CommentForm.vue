<template>
  <div class="comment-form">
    <input
      type="text"
      :readonly="isCommentSending"
      :disabled="isCommentSending"
      placeholder="Ctrl+Enterで固定表示"
      v-model="operatorCommentValue"
      @keydown.enter="sendOperatorComment($event)"
      class="comment-input"
      maxlength="80"
    />
    <button type="submit" :disabled="isCommentSending" @click="sendOperatorComment($event)" class="button comment-button">コメント</button>
    <div class="comment-disabled-message" v-if="programStatus === 'end'">
      番組が終了したため、放送者コメントを投稿できません
    </div>
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
  position: relative;
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

.comment-disabled-message {
  display: flex;
  align-items: center;
  justify-content: center;
  color: @white;
  font-size: 12px;
  width: 100%;
  height: 100%;
  padding: 8px 16px;
  position: absolute;
  top: 0;
  left: 0;
  background-color: rgba(31, 34, 45, .8);
}
</style>
