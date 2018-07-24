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
      type="text"
      class="chatbot__input--search width--auto margin--10"
      placeholder="Search"
    />
  </div>
  <div class="padding--10">
    <div v-if="timers.length === 0">
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
        >
          <td> {{ timer.name }} </td>
          <td> {{ timer.interval }} </td>
          <td> {{ timer.message }} </td>
          <td> {{ timer.chat_lines }} </td>
          <td>
            <div class="align-items--inline">
              <WToggleInput
                :value="timer.enabled"
                @input="toggleEnabletimer(timer.id, index, !timer.enabled)"
              />
              <i class="icon-edit padding--5"></i>
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

  &:hover {
    td {
      color: black;
    }
  }

  td:first-child {
    width: 300px;
  }
  td:last-child {
    width: 100px;
    .align-items--inline;
    .text-align--right;
    padding-right: 10px;
    color: white;

    .icon-edit {
      font-size: 10px;
      .transition;

      &:hover {
        color: @teal;
      }
    }
  }
}


.night-theme {
  td {
    .transition;
  }

  tbody tr {
    border: 2px solid transparent;
    .transition;
    .cursor--pointer;

    &:hover {
      td {
        color: white;
      }
    }
  }
  tbody tr:nth-child(odd) {
    background-color: @navy-secondary;
  }
  tbody tr:nth-child(even) {
    background-color: @navy;
  }

}
</style>
