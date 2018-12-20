<template>
  <div class="chatbot-profile__container">
    <div class="chatbot-profile__header">
      <h3>{{ $t(profile.title) }}</h3>
      <div class="align-items--inline">
        <i class="icon-trash padding--5 cursor--pointer" @click="onDeleteProfileHandler"/>
        <i class="fas icon-edit chatbot-edit cursor--pointer" @click="onEditProfileHandler"/>
      </div>
    </div>

    <div class="chatbot-profile__body">
      <div class="chatbot-profile__content">
        <div v-if="profile.timer.enabled">{{ $t('Duration') }}</div>
        <p v-if="profile.timer.enabled">{{ $t(formatTime(profile.timer.duration)) }}</p>
        <div>{{ $t('Options') }}</div>
        <p
          :class="profile.timer.enabled ? 'chatbot-options': 'chatbot-options-alt'"
        >{{ $t(options) }}</p>
      </div>
      <button
        class="button button--action chatbot-profile__action"
        @click="onStartPollHandler"
      >{{ $t('Start Poll') }}</button>
    </div>
    <ChatbotGenericModalWindow
      :name="DELETE_MODAL"
      @yes="onYesHandler"
      @no="onNoHandler"
      :header="$t('Are you sure you want to delete %{name} ?',{name: profile ? profile.title : ''})"
      :message="$t('Once deleted it can not be recovered.')"
    />
  </div>
</template>

<script lang='ts' src="./ChatbotPollProfile.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.chatbot-edit {
  padding-left: 5px;
  padding-right: 5px;
}

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
      max-width: 210px;
      white-space: nowrap; /*keep text on one line */
      overflow: hidden; /*prevent text from being shown outside the border */
      text-overflow: ellipsis; /*cut off text with an ellipsis*/
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

  .chatbot-options {
    overflow: hidden; /*prevent text from being shown outside the border */
    text-overflow: ellipsis; /*cut off text with an ellipsis*/
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .chatbot-options-alt {
    overflow: hidden; /*prevent text from being shown outside the border */
    text-overflow: ellipsis; /*cut off text with an ellipsis*/
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
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
