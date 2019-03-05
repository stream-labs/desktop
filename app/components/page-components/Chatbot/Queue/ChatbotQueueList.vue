<template>
  <div class="padding--10">
    <div class="flex flex--space-between">
      <h4 class="margin--none">{{ isPicked ? $t('Queued Users') : $t('Pending Users') }}</h4>
      <div>
        <input
          v-if="!isPicked"
          type="text"
          v-model="searchQuery"
          placeholder="Search Pending Users"
        >
      </div>
    </div>
    <br>
    <br>
    <div v-if="dataList.data.length === 0" class="chatbot-empty-placeholder__container">
      <img
        :src="require(`../../../../../media/images/sleeping-kevin-${this.nightMode ? 'night' : 'day'}.png`)"
        width="200"
      >
      <span>{{ $t('No users in this list') }}</span>
    </div>
    <div v-else>
      <table class="queue__table-header">
        <thead>
          <tr>
            <th>#</th>
            <th>{{ $t('Users') }}</th>
            <th>{{ $t('Note') }}</th>
            <th v-bind:style="{display: isPicked ? 'none' : ''}">{{ $t('Time Entered') }}</th>
            <th @click="onClearListHandler" class="text-align--right cursor--pointer">
              <i class="icon-trash padding--5"></i>
              {{ $t('Remove All') }}
            </th>
          </tr>
        </thead>
      </table>
      <div class="queue__table-wrapper" v-on:scroll="scrollDown">
        <table class="queue-table">
          <tbody>
            <tr v-for="(queueUser, index) in dataList.data" :key="queueUser.id">
              <td v-if="!isPicked">{{ queueUser.custom_id}}</td>
              <td v-else>{{ index + 1 }}</td>
              <td>{{ queueUser.viewer.name}}</td>
              <td>{{ queueUser.note || '-' }}</td>
              <td
                v-bind:style="{display: isPicked ? 'none' : ''}"
              >{{ formatDate(queueUser.created_at) }}</td>
              <td class="text-align--right">
                <i class="icon-trash padding--5 cursor--pointer" @click="onRemoveEntryHandler(queueUser)"/>
                <i
                  v-if="!isPicked"
                  class="fas fa-arrow-right chatbot-arrow cursor--pointer"
                  @click="onPickEntryHandler(queueUser.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Modals -->
    <ChatbotGenericModalWindow
      :name="DELETE_MODAL"
      @yes="onYesSingleHandler"
      @no="onNoSingleHandler"
      :header="$t('Are you sure you want to remove %{name}?',{name: selectedUser ? selectedUser.viewer.name : ''})"
      :message="$t('Once removed it can not be recovered.')"
    />
    <ChatbotGenericModalWindow
      :name="DELETE_ALL_MODAL"
      @yes="onYesAllHandler"
      @no="onNoAllHandler"
      :header="$t('Are you sure you want to clear the Queue?')"
      :message="$t('Once cleared it can not be recovered.')"
    />
  </div>
</template>

<script lang='ts' src="./ChatbotQueueList.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.chatbot-empty-placeholder__container {
  .flex();
  .flex--column();
  .flex--center();
  .padding-vertical--20;
}

table {
  table-layout: fixed;
  width: 100%;

  th:nth-child(1),
  td:nth-child(1) {
    width: 50px;
  }

  th:nth-child(2),
  td:nth-child(2) {
    width: 125px;
  }

  th:nth-child(4),
  td:nth-child(4) {
    width: 100px;
  }

  th:nth-child(5),
  td:nth-child(5) {
    width: 125px;
  }

  @media screen and (max-width: 1100px) {
    th:nth-of-type(4),
    td:nth-of-type(4) {
      display: none;
    }
  }
}
.queue__table-header {
  margin-bottom: 0;
}

.queue__table-wrapper {
  overflow-y: auto;
  max-height: ~'calc(75vh - 110px)';
}

.chatbot-arrow {
  .padding-h-sides();
}

h4 {
  line-height: 40px;
}
</style>
