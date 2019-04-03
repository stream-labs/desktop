<template>
<div class="queue-content">
  <!-- batch actions -->
  <div class="flex flex--space-between padding--10">
    <div class="flex">
      <button
        @click="onToggleQueueOpenHandler"
        :disabled="!queueTitle"
        class="button margin--10"
        :class="{
          'button--action' : !queueIsOpen,
          'button--soft-warning' : queueIsOpen,
        }"
      >
        {{ queueIsOpen ? $t('Close Queue') : $t('Open Queue') }}
      </button>
      <button
        @click="onPickRandomEntryHandler"
        :disabled="noUsersInList"
        class="button button--default margin--10"
      >
        {{ $t('Pick Random User') }}
      </button>
    </div>
    <div class="flex flex--center">
      <span> {{ $t('Queue Title') }} </span>
      <input
        type="text"
        :disabled="queueIsOpen"
        v-model="queueTitle"
        class="chatbot__input--search width--auto margin--10"
        :placeholder="$t('Queue Title')"
      />
      <div @click="onOpenQueuePreferencesHandler" class="queue-settings__button">
        <i class="icon-settings"></i> <span> {{ $t('Queue Settings') }} </span>
      </div>
    </div>
  </div>
  <!-- Lists -->
  <div class="list-container row width--100 max-width--100 margin--none">
    <div class="col-sm-12 col-md-7 padding--10">
      <ChatbotQueueList ref="entrylist" type="entry"/>
    </div>
    <div class="col-sm-12 col-md-5 padding--10">
      <ChatbotQueueList type="picked"/>
    </div>
  </div>
</div>
</template>

<script lang='ts' src="./ChatbotQueue.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";
.queue-content {
  height: 100%;
  width: 100%;
}

.list-container {
  height: ~"calc(100% - 72px)"; ;
}

.queue-settings__button {
  .padding-left();
  .cursor--pointer;
}

.chatbot-empty-placeholder__container {
  .flex();
  .flex--column();
  .flex--center();
  .padding-vertical--20;
}

tbody tr {

  td:nth-child(2) {
    width: 300px;
  }
  td:last-child:not(.text-align--center) {
    width: 100px;
    .align-items--inline;
    .text-align--right;
    padding-right: 10px;
  }
}

.icon-edit,
.icon-trash {
  .icon-hover();
}

.chatbot-timers__timer-actions__container {
  button {
    display: block;
    width: 100%;

    &:first-child {
      margin-bottom: 10px;
    }
  }

  .icon-more {
    font-size: 15px;
  }
}
</style>
