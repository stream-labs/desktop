<template>
  <div class="comment-form">
    <input
      type="text"
      ref="input"
      :readonly="isCommentSending"
      :disabled="isCommentSending"
      placeholder="コメントを入力"
      v-model="operatorCommentValue"
      class="comment-input"
      maxlength="80"
      @keydown.enter="sendOperatorComment($event)"
    />
    <button @click="sendOperatorComment($event)" :disabled="isCommentSending || operatorCommentValue.length === 0" class="comment-button"><i class="icon-comment-send"></i></button>
    <div class="comment-disabled-message" v-if="programEnded">
      番組が終了したため、放送者コメントを投稿できません
    </div>
  </div>
</template>

<script lang="ts" src="./CommentForm.vue.ts"></script>
<style lang="less" scoped>
@import "../../styles/index";

.comment-form {
  display: flex;
  justify-content: center;
  padding: 8px;
  border-top: 1px solid @bg-primary;
  background-color: @bg-secondary;
  position: relative;
}

.comment-input {
  font-size: 12px;
  flex-grow: 1;
  width: auto;
  background-color: @bg-quaternary;
  box-sizing: border-box;

  &:focus {
    background-color: @bg-tertiary;

    &::placeholder {
      opacity: .5;
    }
  }

  &::placeholder {
    color: @white;
    opacity: .5;
  }
}

.comment-button {
  height: 36px;
  padding: 0 8px 0 16px;

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
