<template>
  <div class="chatbot-profile__container">
    <div class="chatbot-profile__header">
      <h3>{{ $t(profile.title) }}</h3>
      <DropdownMenu :placement="'bottom-end'" :icon="'icon-more'">
        <div class="chatbot-profile-actions__container">
          <button class="button button--action">{{ $t('Edit') }}</button>
          <button class="button button--soft-warning">{{ $t('Delete') }}</button>
        </div>
      </DropdownMenu>
    </div>

    <div class="chatbot-profile__body">
      <div class="chatbot-profile__content">
        <div>{{ $t('Duration') }}</div>
        <p>{{ $t(formatTime(profile.timer.duration)) }}</p>
        <div>{{ $t('Options') }}</div>
        <p>{{ $t(profile.options[0].name) }}</p>
      </div>
      <button class="button button--action chatbot-profile__action">{{ $t('Start Poll') }}</button>
    </div>
  </div>
</template>

<script lang='ts' src="./ChatbotPollProfile.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';

.chatbot-profile__container {
  display: inline-block;
  margin: 10px;
  width: 300px;
  .radius();
  background-color: @day-secondary;

  .chatbot-profile__header {
    .flex();
    .flex--space-between();
    .flex--v-center();
    .padding--10();

    h3 {
      font-size: 16px;
      .margin--none();
    }

    .chatbot-profile-actions__container {
      button {
        display: block;
        width: 100%;
        &:first-child {
          margin-bottom: 10px;
        }
      }
    }
  }

  .chatbot-profile__body {
    .padding--10();
    .flex();
    color: @day-paragraph;
    height: 200px;
    .flex--column();
    .flex--space-between();

    .chatbot-profile__action {
      .align-items--inline;
    }
  }
}

.night-theme {
  .chatbot-profile__container {
    background-color: @night-accent-light;
  }

  h3,
  p {
    color: white;
  }

  .chatbot-profile__body {
    color: @night-paragraph;
  }
}
</style>
