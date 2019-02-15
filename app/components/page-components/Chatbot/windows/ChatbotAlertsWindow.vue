<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
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
            <span>{{ $t(alertTypeFormattedName(alertTypeName)) }}</span>
            <ToggleInput
              :value="isEnabled(alertTypeName)"
              @input="(enabled, event) => {
                event.stopPropagation();
                onToggleEnableAlertHandler(alertTypeName);
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
          @click="onShowNewChatAlertWindowHandler"
          :disabled="selectedTypeMessages.length >= 100"
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
                <button @click="onEditHandler(message, index)" class="button button--action"> {{  $t('Edit') }} </button>
                <button @click="onDeleteHandler(index)" class="button button--soft-warning"> {{  $t('Delete') }} </button>
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
  <div slot="controls" class="flex flex--space-between">
    <button
      class="button button--default"
      @click="onResetHandler"
    >
      {{ $t('RESET') }}
    </button>
    <button
      class="button button--default"
      @click="onDoneHandler"
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
  margin: -16px;
  width: calc(~"100% + 40px") !important;

  .chatbot-alerts-window__sidebar {
    width: 250px;
    border-right: 1px solid @day-border;

    .chatbot-alerts-window__sidebar__tab {
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
    .padding(2);

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

    &:first-child {
      margin-bottom: 10px;
    }
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

  td:last-child {
    width: 100px;
    .align-items--inline;
    .text-align--right;
    padding-right: 10px;
  }
}

.night-theme {

  tbody tr {
    border: 2px solid transparent;
    .transition;
    .cursor--pointer;
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

  .chatbot-alerts-window__sidebar {
    border-right: 1px solid @night-border;
  }
}


</style>
