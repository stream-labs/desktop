<template>
  <div class="chatbot-vote__container">
    <span>{{ $t(command) }}</span>
    <div class="chatbot-progress__container">
      <span :style="{width:percentage}"></span>
    </div>
    <div class="text-align--right">{{ $t("{amount} Votes | {percent}",{amount: votes, percent: percentage}) }}</div>
  </div>
</template>

<script lang='ts' src="./ChatbotVoteTracker.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.chatbot-vote__container {
  .chatbot-progress__container {
    background-color: @light-3;
    height: 25px; /* Can be anything */
    position: relative;
    .radius();

    span {
      display: block;
      height: 100%;
      background-color: @purple;
      position: relative;
      overflow: hidden;
      .radius();
      transition: 0.4s linear;
      transition-property: width;
    }
  }
}
.night-theme {
  .chatbot-progress__container {
    background-color: @dark-4;
  }
}
</style>
