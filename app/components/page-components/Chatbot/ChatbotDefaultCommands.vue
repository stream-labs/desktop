<template>
  <div>
    <!-- batch actions -->
    <div class="flex flex--space-between margin--10">
      <input
        v-model="searchQuery"
        type="text"
        class="chatbot__input--search width--auto margin--10"
        placeholder="Search"
      >
       <button
        @click="onResetDefaultCommandsHandler"
        class="chatbot__button--reset button button--soft-warning margin--10"
      >{{ $t('Reset Commands') }}</button>
    </div>

    <!-- slugs -->
    <div
      class="command-slug__container"
      v-for="(commands, slugName, index) in filteredSlugs"
      :key="index"
    >
      <h2>{{$t(slugName)}}</h2>
      <!-- commands in slug -->
      <table>
        <thead>
          <tr>
            <th>{{ $t('Command') }}</th>
            <th>{{ $t('Description') }}</th>
            <th>{{ $t('Permission') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(command, commandName, index) in commands" :key="index">
            <td>{{ command.command }}</td>
            <td>{{ $t(command.description) }}</td>
            <td>
              {{ command.static_permission ? $t(chatbotPermissionsEnums[command.static_permission.level]) :
              (command.permission ?$t(chatbotPermissionsEnums[command.permission.level]) : '-') }}
            </td>
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
    </div>
  </div>
</template>

<script lang='ts' src="./ChatbotDefaultCommands.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';
.command-slug__container {
  .margin(2.5);
  .margin-bottom(4);

  h2 {
    .margin-bottom(1);
  }
}

table {
  table-layout: fixed;
  width: 100%;

  tr {
    th:first-child,
    td:first-child {
      white-space: nowrap; /*keep text on one line */
      overflow: hidden; /*prevent text from being shown outside the border */
      text-overflow: ellipsis; /*cut off text with an ellipsis*/
      width: 150px;
    }

    td:nth-child(3),
    th:nth-child(3) {
      width: 125px;
      .text-align--right;
    }

    th:last-child,
    td:last-child {
      width: 100px;
      .align-items--inline;
      .text-align(@right);
      .padding-right();
      color: var(--white);

      .icon-edit {
        font-size: 10px;
        .icon-hover();
      }
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
  }
}
</style>
