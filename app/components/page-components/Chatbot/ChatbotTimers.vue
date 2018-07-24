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
          <th>timer</th>
          <th>message</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(timer, index) in timers"
          :key="index"
        >
          <td> {{ $t(timer.name) }} </td>
          <td> {{ $t(timer.message) }} </td>
          <td>
            <div class="align-items--inline">
              <WToggleInput
                v-if="typeof timer.enabled === 'boolean'"
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
