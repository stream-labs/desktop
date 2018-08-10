<template>
  <div>
    <!-- batch actions -->
    <div class="align-items--inline align-items--top text-align--right padding--10">
      <button
        @click="onResetDefaultCommands"
        class="chatbot__button--reset button button--default margin--10"
      >
        {{ $t('Reset Commands') }}
      </button>
      <input
        v-model="searchQuery"
        type="text"
        class="chatbot__input--search width--auto margin--10"
        placeholder="Search"
      />
    </div>

    <!-- slugs -->
    <div
      class="padding--10"
      v-for="(commands, slugName, index) in commandSlugs"
      :key="index"
    >
      <div class="chatbot__dropdown-header">
        <i class="icon-down"></i>
        <span>{{ $t(slugName) }}</span>
      </div>

      <!-- commands in slug -->
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Description</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(command, commandName, index) in commands"
            :key="index"
            v-if="matchesQuery(commandName, command)"
          >
            <td> {{ $t(command.command) }} </td>
            <td> {{ $t(command.description) }} </td>
            <td>
              <div class="align-items--inline">
                <ToggleInput
                  v-if="typeof command.enabled === 'boolean'"
                  :value="command.enabled"
                  @input="toggleEnableCommand(slugName, commandName, !command.enabled)"
                />
                <i
                  class="icon-edit padding--5"
                  @click="openCommandWindow(slugName, commandName, command)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang='ts' src="./ChatbotDefaultCommands.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";


.chatbot__dropdown-header {
  .align-items--inline;
  .padding--10;
  .text-transform--uppercase;
  border-color: #274959;
  background-color: rgba(27, 47,57, 0.68);
  border-style: solid;
  border-width: 1px 0;
  color: white;
  margin-bottom: 15px;

  .icon-down {
    font-size: 5px;
    .icon--margin;
  }
}

tbody tr {

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

  tbody tr {
    border: 2px solid transparent;
    .transition;

    td {
      color: white;
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
