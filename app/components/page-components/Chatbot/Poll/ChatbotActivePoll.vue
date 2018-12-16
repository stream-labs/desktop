<template>
  <div class="content__container">
    <div class="flex flex--justify-end padding--10">
      <button class="button button--default margin--10" @click="complete" v-if="hasAnyVotes">{{ $t('Complete') }}</button>
      <button class="button button--default margin--10" @click="cancel" v-else>{{ $t('Cancel') }}</button>
      <button class="button button--action margin--10" @click="close" v-if="isPollOpen">{{ $t('Close Poll') }}</button>
      <button class="button button--action margin--10" @click="open" v-else>{{ $t('Open Poll') }}</button>
    </div>
    <div class="header__container">
      <h1>Will I wwin the next game?</h1>
      <div class="flex flex--space-between padding--10">
        <div class="margin-horizontal--10">
          <div class="header__container__title">Loyalty Pot</div>
          <div class="header__container__text">2000</div>
        </div>
        <div class="margin-horizontal--10">
          <div class="header__container__title">Votes</div>
          <div class="header__container__text">{{ $t(total) }}</div>
        </div>
        <div class="margin-horizontal--10">
          <div class="header__container__title">Timer</div>
          <div class="header__container__text">00:45</div>
        </div>
      </div>
    </div>
    <div class="options__container">
      <ChatbotVoteTracker
        v-for="(option) in activePoll.settings.options"
        :key="option.parameter"
        :option="option"
      />
    </div>
  </div>
</template>

<script lang='ts' src="./ChatbotActivePoll.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.header__container {
  .flex;
  .flex--space-between;
  align-items: center;
  .padding--10;
  background-color: @light-3;
  margin: 0 20px;

  h1 {
    margin-bottom: 0;
  }

  .header__container__title {
    font-size: 15px;
  }

  .header__container__text {
    color: @dark-2;
    .flex;
    .flex--center;
    font-size: 15px;
  }
}

.options__container {
  .padding--10;
  .margin-horizontal--10;
}

.night-theme {
  .header__container {
    background-color: @dark-4;

    .header__container__text {
      color: @white;
    }
  }
}
</style>
