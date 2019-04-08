<template>
  <div class="chatbot-profile__container">
    <div class="chatbot-profile__header">
      <h3>{{ $t(profile.title) }}</h3>
      <div class="align-items--inline" v-if="!isActive">
        <i class="icon-trash padding--5 cursor--pointer" @click="onDeleteProfileHandler"/>
        <i class="fas icon-edit chatbot-edit cursor--pointer" @click="onEditProfileHandler"/>
      </div>
    </div>

    <div class="chatbot-profile__timer">
      <div class="chatbot-profile__timer__container">
        <i class="chatbot-profile__timer__container-icon icon-time"/>
        <span
          class="chatbot-profile__timer__container-duration"
        >{{ $t(timeRemaining) }}</span>
       
      </div>
    </div>

    <div class="chatbot-profile__body">
      <div class="chatbot-profile__content">
        <ul v-if="!isActive">
          <li
            v-for="(item, index) in profile.options"
            :key="item.name"
          >{{ $t(`${index+1}. ${item.name}`) }}</li>
        </ul>
        <ChatbotVoteTracker
          v-else
          v-for="(option) in topThreeOptions"
          :key="option.parameter"
          :option="option"
          :thinBars="true"
          :type="type"
        />
      </div>
      <button
        v-if="!isActive"
        class="button button--action chatbot-profile__action"
        @click="onStartHandler"
        :disabled="isOpen"
      >{{ $t(type === 'poll' ? 'Start Poll' : 'Start Bet') }}</button>
      <button
        v-else
        class="button button--action chatbot-profile__action"
        @click="onViewActiveHandler"
      >{{ $t(type === 'poll' ? 'View Active Poll': 'View Active Bet') }}</button>
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

.chatbot-profile__timer {
  background-color: var(--section);
  height: 40px;

  .chatbot-profile__timer__container {
    .flex;
    .flex--center;
    height: 100%;

    .chatbot-profile__timer__container-icon {
      font-size: 20px;
      .margin-right;
    }

    .chatbot-profile__timer__container-duration {
      font-size: 20px;
    }
  }
}

.chatbot-profile__container {
  display: inline-block;
  margin: 10px;
  width: 300px;
  .radius(2);
  background-color: var(--section-alt);

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
    color: var(--paragraph);
    height: 200px;
    .flex--column();
    .flex--space-between();

    .chatbot-profile__content {
      ul {
        columns: 2;
        -webkit-columns: 2;
        li {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .chatbot-profile__action {
      .align-items--inline;
    }
  }
}
</style>
