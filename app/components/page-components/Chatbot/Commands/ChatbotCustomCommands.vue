<template>
  <div>
    <!-- batch actions -->
    <div class="flex flex--space-between padding--10">
      <button
        @click="openCommandWindow"
        class="button button--action margin--10"
      >
        Add Command
      </button>
      <input
        type="text"
        class="chatbot__input--search width--auto margin--10"
        placeholder="Search"
      />
    </div>

    <!-- custom commands -->
    <div class="padding--10">
      <div v-if="commands && commands.length === 0">
        <h2>No custom commands. Click to add new.</h2>
      </div>
      <table v-else>
        <thead>
          <tr>
            <th>Command</th>
            <th>Response</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(command, index) in commands"
            :key="command.command"
          >
            <td> {{ $t(command.command) }} </td>
            <td> {{ $t(command.response) }} </td>
            <td>
              <div class="align-items--inline">
                <ToggleInput
                  :value="command.enabled"
                  @input="toggleEnableCommand(command.id, index, !command.enabled)"
                />
                  <DropdownMenu
                  :placement="'bottom-end'"
                  class="chatbot-alerts__alert-actions_container"
                  :icon="'icon-more'"
                >
                  <button @click="openCommandWindow(index)" class="button button--action">Edit</button>
                  <button @click="deleteCommand(index)" class="button button--soft-warning">Delete</button>
                </DropdownMenu>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang='ts' src="./ChatbotCustomCommands.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";

tbody tr {
  .transition;

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


.night-theme {

  tbody tr {
    border: 2px solid transparent;
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
