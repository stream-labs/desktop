<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Chat Alert Preferences')"
>
  <div slot="content" class="chatbot-alerts-window__container row">
    <div class="chatbot-alerts-window__sidebar small-4">
      <NavMenu v-model="selectedTab" class="side-menu">
        <NavItem
          v-for="(tabData, tabName) in tabs"
          :key="tabName"
          :to="tabName"
          class="padding--10"
        >
          {{ $t(tabName) }}
        </NavItem>
      </NavMenu>
    </div>
    <div class="chatbot-alerts-window__content small-8">
      <div class="chatbot-alerts-window__actions">
        <button class="button button--action">ADD ALERT</button>
      </div>
      <br />
      <table
        v-for="title in selectedTabTableTitles"
        :key="title"
      >
        <thead>
          <tr>
            <th :colspan="selectedTabTableColumns.length">
              {{ title }}
            </th>
          </tr>
          <tr>
            <th
              v-for="column in selectedTabTableColumns"
              :key="column"
            >
              {{ $t(column.split('_').join(' ')) }}
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(message, index) in selectedTabMessages[title]"
            :key=" index"
          >
            <td
              v-for="column in selectedTabTableColumns"
              :key="column"
            >
              {{ message[column] }}
            </td>
            <td>Do stuff</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div slot="controls">
    <button
      class="button button--default"
      @click="onDone"
    >
      DONE
    </button>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotAlertsWindow.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";
.chatbot-alerts-window__container {
  margin: -20px;

  .chatbot-alerts-window__sidebar {
    .padding--10();
    background: @day-secondary;
    border-right: 1px solid @day-border;
  }

  .chatbot-alerts-window__content {
    .overflow--auto();

    .chatbot-alerts-window__actions {
      .align-items--inline();
      .text-align--right();
    }
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
  .chatbot-alerts-window__sidebar {
    border-color: @night-secondary;
    background-color: @night-secondary;
  }

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
