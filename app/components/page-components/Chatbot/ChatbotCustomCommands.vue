<template>
  <div>
    <!-- batch actions -->
    <div class="flex flex--space-between padding--10">
      <button
        @click="onOpenCommandWindowHandler"
        class="button button--action margin--10 button--add-command"
      >{{ $t('Add Command') }}</button>

      <div class="flex flex--center">
        <div @click="onOpenCommandPreferencesHandler()" class="command-settings__button">
          <i class="icon-settings"></i>
          <span>{{ $t('Command Settings') }}</span>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          class="chatbot__input--search width--auto margin--10"
          placeholder="Search"
        >
      </div>
    </div>

    <!-- custom commands -->
    <div v-if="!commands || commands.length === 0" class="chatbot-empty-placeholder__container">
      <img
        :src="require(`../../../../media/images/chatbot/chatbot-placeholder-command--${this.nightMode ? 'night' : 'day'}.svg`)"
        width="200"
      >
      <span>{{ $t('Click add command to get started.') }}</span>
    </div>
    <div v-else class="padding--10 margin-horizontal--10">
      <table>
        <thead>
          <tr>
            <th>{{ $t('Command') }}</th>
            <th>{{ $t('Response') }}</th>
            <th>
              <div class="flex">
                GCD
                <i class="icon-question icon-btn" v-tooltip="$t('Global Cooldown in seconds')"/>
              </div>
            </th>
            <th>
              <div class="flex">
                UCD
                <i class="icon-question icon-btn" v-tooltip="$t('User Cooldown in seconds')"/>
              </div>
            </th>
            <th>{{ $t('Permission') }}</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(command, index) in commands" :key="command.id">
            <td>{{ $t(command.command) }}</td>
            <td>{{ $t(command.response) }}</td>
            <td>{{ command.cooldowns.global }}</td>
            <td>{{ command.cooldowns.user }}</td>
            <td>{{ command.permission ? $t(chatbotPermissionsEnums[command.permission.level]) : '-' }}</td>
            <td>
              <ToggleInput
                :value="command.enabled"
                @input="onToggleEnableCommandHandler(command.id, index, !command.enabled)"
              />
            </td>
            <td>
              <div class="align-items--inline">
                <i
                  class="icon-trash padding--5 cursor--pointer"
                  @click="onDeleteCommandHandler(command)"
                />
                <i
                  class="fas icon-edit chatbot-edit cursor--pointer"
                  @click="onOpenCommandWindowHandler(command)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <ChatbotPagination
        v-if="totalPages > 1"
        :totalPages="totalPages"
        :currentPage="currentPage"
        @change="fetchCommands"
      />
      <ChatbotGenericModalWindow
        :name="DELETE_COMMAND_MODAL"
        @yes="onYesHandler"
        @no="onNoHandler"
        :header="$t('Are you sure you want to delete %{name} ?',{name: selectedCommand ? selectedCommand.command : ''})"
        :message="$t('Once deleted it can not be recovered.')"
      />
    </div>
  </div>
</template>

<script lang='ts' src="./ChatbotCustomCommands.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';

.icon-question {
  .icon-hover();
}

.command-settings__button {
  .padding-left();
  .cursor--pointer;
}

table {
  table-layout: fixed;
  width: 100%;

  tr {
    .transition;

    th:first-child,
    td:first-child {
      white-space: nowrap; /*keep text on one line */
      overflow: hidden; /*prevent text from being shown outside the border */
      text-overflow: ellipsis; /*cut off text with an ellipsis*/
      width: 125px;
    }

    td:nth-child(2) {
      white-space: nowrap; /*keep text on one line */
      overflow: hidden; /*prevent text from being shown outside the border */
      text-overflow: ellipsis; /*cut off text with an ellipsis*/
    }

    th:nth-child(3),
    th:nth-child(4),
    td:nth-child(3),
    td:nth-child(4) {
      width: 50px;

      @media (max-width: 1100px) {
        display: none;
      }
    }

    td:nth-child(5),
    th:nth-child(5) {
      width: 150px;
      .text-align--right;
    }

    td:nth-child(6),
    th:nth-child(6) {
      width: 50px;
    }

    th:last-child,
    td:last-child {
      width: 100px;
      .align-items--inline;
      .text-align--right;
      padding-right: 10px;
    }
  }
}

.chatbot-edit {
  padding-left: 5px;
  padding-right: 5px;
}

.chatbot-empty-placeholder__container {
  .flex();
  .flex--column();
  .flex--center();
  .padding-vertical--20;
}

.chatbot-custom-commands__command-actions__container {
  button {
    display: block;
    width: 100%;

    &:first-child {
      margin-bottom: 10px;
    }
  }
}

.night-theme {
  .icon-question {
    .night-icon-hover();
    padding-left: 3px;
  }
}
</style>
