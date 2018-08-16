<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Chat Alert Preferences')"
>
  <div slot="content" class="chatbot-alerts-window__container flex">
    <div class="chatbot-alerts-window__sidebar">
      <NavMenu v-model="selectedType" class="side-menu">
        <NavItem
          v-for="(alertTypeData, alertTypeName) in alertTypes"
          :key="alertTypeName"
          :to="alertTypeName"
          class="chatbot-alerts-window__sidebar__tab"
        >
          <div class="chatbot-alerts-window__sidebar__tab__content">
            <span>{{ $t(alertTypeName) }}</span>
            <ToggleInput
              :value="isEnabled(alertTypeName)"
              @input="(enabled, event) => {
                event.stopPropagation();
                toggleEnableAlert(alertTypeName);
              }"
            />
          </div>
        </NavItem>
      </NavMenu>
    </div>
    <div class="chatbot-alerts-window__content">
      <div class="chatbot-alerts-window__actions">
        <button
          class="button button--action"
          @click="showNewChatAlertWindow"
        >
          {{ $t('add alert') }}
        </button>
      </div>
      <br />
      <table>
        <thead>
          <tr>
            <th
              v-for="column in selectedTypeTableColumns"
              :key="column"
              :class="`column--${column}`"
            >
              {{ $t(formatHeader(column)) }}
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(message, index) in selectedTypeMessages"
            :key="`${message.message}__${index}`"
          >
            <td
              v-for="column in selectedTypeTableColumns"
              :key="column"
            >
              {{ formatValue(message[column], column) }}
            </td>
            <td>
              <DropdownMenu
                :placement="'bottom-end'"
                class="chatbot-alerts__alert-actions__container"
                :icon="'icon-more'"
              >
                <button @click="onEdit(message, index)" class="button button--action"> {{  $t('Edit') }} </button>
                <button @click="onDelete(index)" class="button button--soft-warning"> {{  $t('Delete') }} </button>
              </DropdownMenu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <ChatbotNewAlertModalWindow
      :selectedType="selectedType"
    />
  </div>
  <div slot="controls">
    <button
      class="button button--default"
      @click="onDone"
    >
      {{ $t('DONE') }}
    </button>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotAlertsWindow.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";

.chatbot-alerts-window__container {
  margin: -20px;
  width: calc(~"100% + 40px") !important;

  .chatbot-alerts-window__sidebar {
    width: 250px;
    .padding--10();
    background: @day-secondary;
    border-right: 1px solid @day-border;

    .chatbot-alerts-window__sidebar__tab {
      .margin();
      .text-transform();
      padding-left: 20px;

      .chatbot-alerts-window__sidebar__tab__content {
        .flex();
        .flex--space-between();
        .flex--v-center();
        padding: 5px 0;
      }
    }
  }

  .chatbot-alerts-window__content {
    width: 100%;
    .overflow--auto();
    .padding--20();

    .chatbot-alerts-window__actions {
      .align-items--inline();
      .text-align--right();
    }
  }
}

.chatbot-alerts__alert-actions__container {
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

table thead tr th {
  &.column--is_gifted,
  &.column--months {
    width: 100px;
  }
}

tbody tr {
  .transition;

  td {
    color: black;
  }

  &:hover {
    td {
      color: black;
    }
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
  .chatbot-alerts-window__sidebar {
    border-color: @night-secondary;
    background-color: @night-secondary;
  }

  tbody tr {
    border: 2px solid transparent;
    .transition;
    .cursor--pointer;
    .transition;

    td {
      color: white;
    }

    &:hover {
      td {
        color: white;
      }
    }

    td:last-child {
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
