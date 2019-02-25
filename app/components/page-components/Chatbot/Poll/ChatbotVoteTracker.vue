<template>
  <div class="chatbot-vote__container" v-if="!thinBars">
    <span
      class="chatbot-vote__container__name"
    >{{ $t("{name} ({command})",{name:name, command: command}) }}</span>
    <div class="flex flex--center">
      <div class="flex--grow">
        <div class="chatbot-progress__container ">
          <span :style="{width:percentage}"></span>
        </div>
        <div
          v-if="type === 'poll'"
          class="text-align--right"
        >{{ $t("{amount} Votes | {percent}",{amount: amount, percent: percentage}) }}</div>
        <div
          v-else
          class="text-align--right"
        >{{ $t("{loyalty} Loyalty | {amount} Bets | {percent}",{loyalty: loyalty, amount: amount, percent: percentage}) }}</div>
      </div>
      <button
        v-if="type !== 'poll'"
        class="button button--action button--winner"
        @click="onPickWinnerHandler"
        :disabled="isPicked || !isClosed"
      >
        <i class="fa fa-trophy trophy-icon"/>
        {{ $t('Pick Winner') }}
      </button>
    </div>
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

<script lang='ts' src="./ChatbotVoteTracker.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.chatbot-vote__container {
  .chatbot-progress__container,
  .chatbot-progress__container-alt {
    background-color: @light-3;
    height: 32px;
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
.button--winner {
  margin-bottom: 20px;
  margin-left: 10px;
  margin-top: 0px;
  margin-right: 0px;
}
.night-theme {
  .chatbot-progress__container {
    background-color: @dark-4;
  }
  .chatbot-progress__container-alt {
    background-color: @dark-5;
  }

  .trophy-icon {
    transition: none !important;
    color: inherit;
    transition-delay: 0s;

    &:hover {
      color: @white;
    }
  }
}
</style>
