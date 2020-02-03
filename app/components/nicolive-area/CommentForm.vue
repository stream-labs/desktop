<template>
  <div class="comment-form">
    <input
      type="text"
      :readonly="isCommentSending"
      :disabled="isCommentSending"
      placeholder="コメントを入力"
      v-model="operatorCommentValue"
      @keydown.enter="sendOperatorComment($event)"
      class="comment-input"
      maxlength="80"
    />
    <button type="submit" :disabled="isCommentSending || operatorCommentValue.length === 0" @click="sendOperatorComment($event)" class="comment-button"><i class="icon-comment-send"></i></button>
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
  background-color: @bg-secondary;
  position: relative;
}

.comment-input {
  font-size: 12px;
  flex-grow: 1;
  width: auto;
  background-color: @bg-primary;
  padding-right: 36px;
  box-sizing: border-box;

  &:focus {
    background-color: @bg-secondary;

    &::placeholder {
      opacity: .5;
    }
  }

  &:hover {
    &:not(:focus)::placeholder {
      opacity: 1;
    }
  }

  &::placeholder {
    color: @white;
    opacity: .5;
  }
}

.comment-button {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);

  > i {
    font-size: 14px;
    color: @text-secondary;
  }

  &:hover {
    > i {
      color: @text-primary;
    }
  }

  &:disabled {
    > i {
      color: @white;
      opacity: .26;
    }
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
