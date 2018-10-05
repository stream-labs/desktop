<template>
  <div>
    <!-- batch actions -->
    <div class="align-items--inline align-items--top text-align--right padding--10">
      <button
        @click="onResetDefaultCommandsHandler"
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
    <CollapsibleSection
      class="margin--20"
      v-for="(commands, slugName, index) in commandSlugs"
      v-if="v1CommandSlugs.indexOf(slugName) > -1"
      :title="$t(slugName)"
      :key="index"
    >
      <!-- commands in slug -->
      <table>
        <thead>
          <tr>
            <th> {{ $t('Command') }} </th>
            <th> {{ $t('Description') }} </th>
            <th> {{ $t('Static Permission') }} </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(command, commandName, index) in commands"
            :key="index"
            v-if="matchesQuery(commandName, command)"
          >
            <td> {{ command.command }} </td>
            <td> {{ $t(command.description) }} </td>
            <td> {{ command.static_permission ? $t(chatbotPermissionsEnums[command.static_permission.level]) : '-' }} </td>
            <td>
              <div class="align-items--inline">
                <ToggleInput
                  v-if="typeof command.enabled === 'boolean'"
                  :value="command.enabled"
                  @input="onToggleEnableCommandHandler(slugName, commandName, !command.enabled)"
                />
                <i
                  class="icon-edit padding--5 cursor--pointer"
                  @click="onOpenCommandWindowHandler(slugName, commandName, command)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </CollapsibleSection>
  </div>
</template>

<script lang='ts' src="./ChatbotDefaultCommands.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

table tr {

  td:first-child {
    width: 300px;
  }

  td:nth-child(3),
  th:nth-child(3) {
    width: 200px;
    .text-align--right;
  }
  td:last-child {
    width: 100px;
    .align-items--inline;
    .text-align(@right);
    .padding-right();
    color: @white;

    .icon-edit {
      font-size: 10px;
      .icon-hover();
    }
  }
}


.night-theme {

  tbody tr {
    border: 2px solid transparent;
    .transition();

    td {
      color: white;
    }

    td:last-child {
      .icon-edit {
        .night-icon-hover();
      }
    }
  }
}
</style>
