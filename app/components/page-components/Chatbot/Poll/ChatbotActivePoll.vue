<template>
  <div class="content__container">
    <div class="flex flex--space-between padding--10">
      <button class="button button--trans margin--10" @click="onBackHandler">
        <i class="fa fa-angle-left back-icon"></i>
        {{$t('Back')}}
      </button>
      <div>
        <button
          class="button button--default margin--10"
          @click="onCancelHandler"
          v-if="isCancelable"
        >{{ $t('Cancel') }}</button>
        <button
          class="button button--default margin--10"
          @click="onCompleteHandler"
          v-else
          :disabled="isOpen"
        >{{ $t('Complete') }}</button>
        <button
          class="button button--action margin--10"
          @click="onToggleStateHandler"
          v-if="isOpen"
        >{{ $t(type === 'poll' ? 'Close Poll': 'Close Betting') }}</button>
        <button
          class="button button--action margin--10"
          @click="onToggleStateHandler"
          :disabled="isPicked"
          v-else
        >{{ $t(type === 'poll' ? 'Open Poll' : 'Open Betting') }}</button>
      </div>
    </div>
    <div class="header__container">
      <h1>{{active.settings.title}}</h1>
      <div class="flex flex--space-between padding--10">
        <div v-if="type !=='poll'" class="margin-horizontal--10">
          <div class="header__container__text">{{ loyalty }}</div>
          <div class="header__container__title">{{ $t('Loyalty Pot') }}</div>
        </div>
        <div class="margin-horizontal--10">
          <div class="header__container__text">{{ total }}</div>
          <div class="header__container__title">{{ $t(type ==='poll' ? 'Votes' : 'Bets') }}</div>
        </div>
        <div class="margin-horizontal--10">
          <div class="header__container__text">{{ $t(timeRemaining) }}</div>
          <div
            class="header__container__title"
          >{{ $t(active.settings.timer.enabled ? 'Time Left' : 'Time Elapsed') }}</div>
        </div>
      </div>
    </div>
    <div class="options__container">
      <ChatbotVoteTracker
        v-for="(option) in active.settings.options"
        :key="option.parameter"
        :option="option"
        :type="type"
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
      color: var(--white);
    }
  }

  .back-icon {
    transition: none !important;
    color: inherit;
    transition-delay: 0s;

    &:hover {
      color: var(--white);
    }
  }
}
</style>
