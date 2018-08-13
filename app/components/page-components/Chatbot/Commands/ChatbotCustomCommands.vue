<template>
  <div>
    <!-- batch actions -->
    <div class="flex flex--space-between padding--10">
      <button
        @click="openCommandWindow"
        class="button button--action margin--10"
      >
        {{ $t('Add Command') }}
      </button>
      <input
        v-model="searchQuery"
        type="text"
        class="chatbot__input--search width--auto margin--10"
        placeholder="Search"
      />
    </div>

    <!-- custom commands -->
    <div class="padding--10">
      <table>
        <thead>
          <tr>
            <th> {{ $t('Command') }} </th>
            <th> {{ $t('Response') }} </th>
            <th> {{ $t('Global Cooldown in mins') }} </th>
            <th> {{ $t('User Cooldown in mins') }} </th>
            <th> {{ $t('Permission') }} </th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="commands && commands.length > 0">
          <tr
            v-for="(command, index) in commands"
            :key="command.id"
            v-if="matchesQuery(command)"
          >
            <td> {{ $t(command.command) }} </td>
            <td> {{ $t(command.response) }} </td>
            <td> {{ command.cooldowns.global }} </td>
            <td> {{ command.cooldowns.user }} </td>
            <td> {{ command.permission ? $t(chatbotPermissionsEnums[command.permission.level]) : '-' }} </td>
            <td>
              <div class="align-items--inline">
                <ToggleInput
                  :value="command.enabled"
                  @input="toggleEnableCommand(command.id, index, !command.enabled)"
                />
                <DropdownMenu
                  :placement="'bottom-end'"
                  class="chatbot-custom-commands__command-actions__container"
                  :icon="'icon-more'"
                >
                  <button @click="openCommandWindow(command)" class="button button--action"> {{  $t('Edit') }} </button>
                  <button @click="deleteCommand(command)" class="button button--soft-warning"> {{  $t('Delete') }} </button>
                </DropdownMenu>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="6" class="text-align--center"> {{ $t('Click add command to get started.') }} </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang='ts' src="./ChatbotCustomCommands.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";

table tr {
  .transition;

  td:first-child {
    width: 300px;
  }

  td:nth-child(5),
  th:nth-child(5) {
    width: 200px;
    .text-align--right;
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

.chatbot-custom-commands__command-actions__container {
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
