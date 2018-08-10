<template>
<div>
  <!-- batch actions -->
  <div class="flex flex--space-between padding--10">
    <button
      @click="openTimerWindow"
      class="button button--action margin--10"
    >
      Add Timer
    </button>
    <input
      v-model="searchQuery"
      type="text"
      class="chatbot__input--search width--auto margin--10"
      placeholder="Search"
    />
  </div>
  <div class="padding--10">
    <div v-if="timers && timers.length === 0">
      <h2>No timers. Click to add new.</h2>
    </div>
    <table v-else>
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
            v-if="matchesQuery(timer)"
        >
          <td> {{ timer.name }} </td>
          <td> {{ timer.interval }} </td>
          <td> {{ timer.message }} </td>
          <td> {{ timer.chat_lines }} </td>
          <td>
            <div class="align-items--inline">
              <ToggleInput
                :value="timer.enabled"
                @input="toggleEnableTimer(timer.id, index, !timer.enabled)"
              />
              <DropdownMenu
                :placement="'bottom-end'"
                class="chatbot-timers__timer-actions__container"
                :icon="'icon-more'"
              >
                <button @click="openTimerWindow(timer)" class="button button--action"> {{  $t('Edit') }} </button>
                <button @click="deleteTimer(timer)" class="button button--soft-warning"> {{  $t('Delete') }} </button>
              </DropdownMenu>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
</template>

<script lang='ts' src="./ChatbotTimers.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";


tbody tr {
  .transition;
  .cursor--pointer;

  td {
    color: black;
  }

  td:first-child {
    width: 300px;
  }
  td:last-child {
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
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
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
