<template>
  <div class="content__container">
    <div class="flex flex--justify-end padding--10">
      <button
        class="button button--default margin--10"
        @click="complete"
        v-if="hasAnyVotes"
        :disabled="isPollOpen"
      >{{ $t('Complete') }}</button>
      <button
        class="button button--default margin--10"
        @click="cancel"
        v-if="!hasAnyVotes"
      >{{ $t('Cancel') }}</button>
      <button
        class="button button--action margin--10"
        @click="toggleState"
        v-if="isPollOpen"
      >{{ $t('Close Poll') }}</button>
      <button
        class="button button--action margin--10"
        @click="toggleState"
        v-else
      >{{ $t('Open Poll') }}</button>
    </div>
    <div class="header__container">
      <h1>{{activePoll.settings.title}}</h1>
      <div class="flex flex--space-between padding--10">
        <div class="margin-horizontal--10">
          <div class="header__container__text">{{ total }}</div>
          <div class="header__container__title">{{ $t('Votes') }}</div>
        </div>
        <div class="margin-horizontal--10">
          <div class="header__container__text">{{ $t(timeRemaining) }}</div>
          <div
            class="header__container__title"
          >{{ $t(activePoll.settings.timer.enabled ? 'Time Left' : 'Time Elapsed') }}</div>
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
    <ChatbotGenericModalWindow
      :name="CANCEL_MODAL"
      @yes="onYesCancelHandler"
      @no="onNoCancelHandler"
      :header="$t('Are you sure you want to cancel your poll?')"
    />
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
    font-size: 16px;
    .flex;
    .flex--center;
  }

  .header__container__text {
    color: @dark-2;
    .flex;
    .flex--center;
    font-size: 18px;
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
