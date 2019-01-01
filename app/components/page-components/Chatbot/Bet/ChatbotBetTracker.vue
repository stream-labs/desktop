<template>
  <div class="chatbot-vote__container" v-if="!thinBars">
    <span
      class="chatbot-vote__container__name"
    >{{ $t("{name} ({command})",{name:name, command: command}) }}</span>
    <div class="chatbot-progress__container">
      <span :style="{width:percentage}"></span>
    </div>
    <div
      class="text-align--right"
    >{{ $t("{amount} Votes | {percent}",{amount: votes, percent: percentage}) }}</div>
  </div>
  <div class="chatbot-vote__container" v-else>
    <div class="flex flex--space-between">
      <span class="chatbot-vote__container__name">{{ $t(name) }}</span>
      <div class="text-align--right">{{ $t(percentage) }}</div>
    </div>
    <div class="chatbot-progress__container-alt chatbot-progress__container--thin">
      <span :style="{width:percentage}"></span>
    </div>
  </div>
</template>

<script lang='ts' src="./ChatbotBetTracker.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.chatbot-vote__container {
  .chatbot-progress__container,
  .chatbot-progress__container-alt {
    background-color: @light-3;
    height: 25px;
    position: relative;
    .radius();

    span {
      display: block;
      height: 100%;
      background-color: @purple;
      position: relative;
      .radius();
      transition: 0.4s linear;
      transition-property: width;
    }
  }

  .chatbot-progress__container-alt {
    background-color: @light-4;
  }

  .chatbot-vote__container__name {
    white-space: nowrap; /*keep text on one line */
    overflow: hidden; /*prevent text from being shown outside the border */
    text-overflow: ellipsis; /*cut off text with an ellipsis*/
    .margin-right;
  }

  .chatbot-progress__container--thin {
    height: 5px;

    span {
      white-space: nowrap; /*keep text on one line */
      overflow: hidden; /*prevent text from being shown outside the border */
      text-overflow: ellipsis; /*cut off text with an ellipsis*/
    }
  }
}
.night-theme {
  .chatbot-progress__container {
    background-color: @dark-4;
  }
  .chatbot-progress__container-alt {
    background-color: @dark-5;
  }
}
</style>
