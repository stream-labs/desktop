<template>
<div>
  <!-- batch actions -->
  <div class="flex flex--space-between padding--10">
    <button
      @click="onOpenTimerWindowHandler"
      class="button button--action margin--10"
    >
      {{ $t('Add Timer') }}
    </button>
    <input
      v-model="searchQuery"
      type="text"
      class="chatbot__input--search width--auto margin--10"
      placeholder="Search"
    />
  </div>
  <div v-if="!timers || timers.length === 0" class="chatbot-empty-placeholder__container">
    <img
      :src="require(`../../../../media/images/chatbot/chatbot-placeholder-timer--${this.nightMode ? 'night' : 'day'}.svg`)"
      width="200"
    />
    <span>{{ $t('Click add timer to get started.') }}</span>
  </div>
  <div v-else class="padding--10">
    <table>
      <thead>
        <tr>
          <th> {{ $t("timer") }} </th>
          <th> {{ $t("interval") }} </th>
          <th> {{ $t("response") }} </th>
          <th> {{ $t("line minimum") }} </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(timer, index) in timers"
          :key="timer.name"
        >
          <td> {{ timer.name }} </td>
          <td> {{ timer.interval }} </td>
          <td> {{ timer.message }} </td>
          <td> {{ timer.chat_lines }} </td>
          <td>
            <div class="align-items--inline">
              <ToggleInput
                :value="timer.enabled"
                @input="onToggleEnableTimerHandler(timer.id, index, !timer.enabled)"
              />
              <DropdownMenu
                :placement="'bottom-end'"
                class="chatbot-timers__timer-actions__container"
                :icon="'icon-more'"
              >
                <button @click="onOpenTimerWindowHandler(timer)" class="button button--action"> {{  $t('Edit') }} </button>
                <button @click="onDeleteTimerHandler(timer)" class="button button--soft-warning"> {{  $t('Delete') }} </button>
              </DropdownMenu>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <ChatbotPagination
      v-if="totalPages > 1"
      :totalPages="totalPages"
      :currentPage="currentPage"
      @change="fetchTimers"
    />
  </div>
</div>
</template>

<script lang='ts' src="./ChatbotQuotes.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.chatbot-empty-placeholder__container {
  .flex();
  .flex--column();
  .flex--center();
  .padding-vertical--20;
}

tbody tr {
  .transition;
  .cursor--pointer;

  td {
    color: black;
  }

  td:first-child {
    width: 300px;
  }
  td:last-child:not(.text-align--center) {
    width: 100px;
    .align-items--inline;
    .text-align--right;
    padding-right: 10px;

    .icon-edit {
      font-size: 10px;
      .transition;

      &:hover {
        color: @teal;
      }
    }
  }
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



.night-theme {
  td {
    .transition;
    color: white;
  }

  tbody tr {
    border: 2px solid transparent;
    .transition;
    .cursor--pointer;
    color: white;
  }
  tbody tr:nth-child(odd) {
    background-color: @navy-secondary;
  }
  tbody tr:nth-child(even) {
    background-color: @navy;
  }
}
</style>
