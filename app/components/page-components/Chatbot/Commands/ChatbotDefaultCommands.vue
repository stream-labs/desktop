<template>
<div>
  <!-- batch actions -->
  <div class="align-items--inline align-items--top text-align--right padding--10">
    <button
      class="chatbot__button--reset button margin--10"
    >
      Reset Commands
    </button>
    <input
      type="text"
      class="chatbot__input--search width--auto margin--10"
      placeholder="Search"
    />
  </div>

  <!-- slugs -->
  <div
    v-for="(commands, slugName, index) in commandSlugs"
    :key="index"
  >
    <div>
      <span>V</span>
      {{ $t(slugName) }}
    </div>

    <!-- commands in slug -->
    <table>
      <thead>
        <tr>
          <th>Command</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(command, key, index) in commands"
          :key="index"
        >
          <td> {{ $t(command.command) }} </td>
          <td> {{ $t(command.description) }} </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
</template>

<script lang='ts' src="./ChatbotDefaultCommands.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";


.night-theme {
  tbody tr {
    border: none;
    border-width: 0 0 0 0;
  }
  tbody tr:nth-child(odd) {
    background-color: @navy-secondary;
  }
  tbody tr:nth-child(even) {
    background-color: @navy;
  }
}
</style>
