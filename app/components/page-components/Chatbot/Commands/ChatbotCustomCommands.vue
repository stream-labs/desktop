<template>
  <div>
    <!-- batch actions -->
    <div class="flex flex--space-between padding--10">
      <button
        @click="onOpenCommandWindowHandler"
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
    <div v-if="!commands || commands.length === 0" class="chatbot-empty-placeholder__container">
      <img
        :src="require(`../../../../../media/images/chatbot/chatbot-placeholder-command--${this.nightMode ? 'night' : 'day'}.svg`)"
        width="200"
      />
      <span>{{ $t('Click add command to get started.') }}</span>
    </div>
    <div v-else class="padding--10">
      <table>
        <thead>
          <tr>
            <th> {{ $t('Command') }} </th>
            <th> {{ $t('Response') }} </th>
            <th>
              <div class="flex">
                GCD
                <i class="icon-question icon-btn" v-tooltip="$t('Global Cooldown in seconds')" />
              </div>
            </th>
            <th>
              <div class="flex">
                UCD
                <i class="icon-question icon-btn" v-tooltip="$t('User Cooldown in seconds')" />
              </div>
            </th>
            <th> {{ $t('Permission') }} </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(command, index) in commands"
            :key="command.id"
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
                  @input="onToggleEnableCommandHandler(command.id, index, !command.enabled)"
                />
                <DropdownMenu
                  :placement="'bottom-end'"
                  :icon="'icon-more'"
                >
                  <div class="chatbot-custom-commands__command-actions__container">
                    <button @click="onOpenCommandWindowHandler(command)" class="button button--action"> {{  $t('Edit') }} </button>
                    <button @click="onDeleteCommandHandler(command)" class="button button--soft-warning"> {{  $t('Delete') }} </button>
                  </div>
                </DropdownMenu>
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
    </div>
  </div>
</template>

<script lang='ts' src="./ChatbotCustomCommands.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";

.icon-question {
  .icon-hover();
}

table tr {
  .transition;

  td:first-child {
    width: 200px;
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
  }
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
