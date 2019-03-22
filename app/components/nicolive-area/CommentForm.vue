<template>
  <div>
    <input type="text" :readonly="isCommentSending" :disabled="isCommentSending" placeholder="(Ctrl+Enterで固定表示)" v-model="operatorCommentValue" @keydown.enter="sendOperatorComment($event)" >
    <button type="submit" :disabled="isCommentSending" @click="sendOperatorComment($event)">送信</button>
  </div>
</template>

<script lang="ts" src="./CommentForm.vue.ts"></script>
