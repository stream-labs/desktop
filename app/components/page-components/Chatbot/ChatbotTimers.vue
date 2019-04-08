<template>
  <div>
    <!-- batch actions -->
    <div class="flex flex--space-between padding--10">
      <button
        @click="onOpenTimerWindowHandler"
        class="button button--action margin--10"
      >{{ $t('Add Timer') }}</button>
      <input
        v-model="searchQuery"
        type="text"
        class="chatbot__input--search width--auto margin--10"
        placeholder="Search"
      >
    </div>

    <empty-section
      v-if="!timers || timers.length === 0"
      :variation="'text'"
      :title="$t('You don\'t have any Timers')"
      :subtitle="$t('Click Add Timer to get started')"
    ></empty-section>
    <div v-else class="padding--10 margin-horizontal--10">
      <table>
        <thead>
          <tr>
            <th>{{ $t("Timer") }}</th>
            <th>{{ $t("Response") }}</th>
            <th>
              <div class="flex">
                {{ $t("Interval ") }}
                <i
                  class="icon-question icon-btn"
                  v-tooltip="$t('In Minutes')"
                />
              </div>
            </th>
            <th>{{ $t("Line Minimum") }}</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(timer, index) in timers" :key="timer.name">
            <td>{{ timer.name }}</td>
            <td>{{ timer.message }}</td>
            <td>{{ timer.interval }}</td>
            <td>{{ timer.chat_lines }}</td>
            <td>
              <div class="align-items--inline">
                <ToggleInput
                  :value="timer.enabled"
                  @input="onToggleEnableTimerHandler(timer.id, index, !timer.enabled)"
                />
              </div>
            </td>
            <td>
              <div class="align-items--inline">
                <i
                  class="icon-trash padding--5 cursor--pointer"
                  @click="onDeleteTimerHandler(timer)"
                />
                <i
                  class="fas icon-edit chatbot-edit cursor--pointer"
                  @click="onOpenTimerWindowHandler(timer)"
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
        @change="fetchTimers"
      />
      <ChatbotGenericModalWindow
        :name="DELETE_COMMAND_MODAL"
        @yes="onYesHandler"
        @no="onNoHandler"
        :header="$t('Are you sure you want to delete %{name} ?',{name: selectedTimer ? selectedTimer.name : ''})"
        :message="$t('Once deleted it can not be recovered.')"
      />
    </div>
  </div>
</template>

<script lang='ts' src="./ChatbotTimers.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';
table {
  table-layout: fixed;
  width: 100%;

  tr {
    th:first-child,
    td:first-child {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 125px;
    }

    th:nth-child(2),
    td:nth-child(2) {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    td:nth-child(3),
    th:nth-child(3),
    td:nth-child(4),
    th:nth-child(4) {
      width: 100px;
    }

    td:nth-child(5),
    th:nth-child(5) {
      width: 50px;
    }

    th:last-child:not(.text-align--center),
    td:last-child:not(.text-align--center) {
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

.chatbot-timers__timer-actions__container {
  button {
    display: block;
    width: 100%;

    &:first-child {
      margin-bottom: 10px;
    }
  }

  .icon-more {
    font-size: 15px;
  }
}
</style>
