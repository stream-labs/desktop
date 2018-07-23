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
    <div v-if="commands.length === 0">
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
          :key="index"
        >
          <td> {{ $t(command.command) }} </td>
          <td> {{ $t(command.response) }} </td>
          <td>
            <div class="align-items--inline">
              <WToggleInput
                v-if="typeof command.enabled === 'boolean'"
                :value="command.enabled"
                @input="toggleEnableCommand(command.id, index, !command.enabled)"
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

<script lang='ts' src="./ChatbotCustomCommands.vue.ts"></script>

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
