<template>
  <transition name="fade" mode="out-in" appear>
    <div class="chatbot-empty-placeholder__container" key="empty-placeholder" v-if="!enabled">
      <img
        class="loyalty-image"
        :src="require(`../../../../media/images/chatbot/chatbot-placeholder-timer--${this.nightMode ? 'night' : 'day'}.svg`)"
        width="200"
      >
      <h1>{{ $t('Loyalty') }}</h1>
      <span
        class="loyalty-information__container"
      >{{ $t('Your viewers earn currency while you stream. They can use their currency\r\nin minigames, giveaways and to trigger commands.') }}</span>
      <button
        @click="onEnableLoyaltyHandler()"
        class="button button--action margin--10"
      >{{ $t('Enable Loyalty') }}</button>
    </div>
    <div class="loyalty-content" v-else>
      <!-- batch actions -->
      <div class="flex flex--space-between padding--10">
        <div class="flex flex--center">
          <button
            @click="onOpenLoyaltyAddallHandler()"
            class="button button--action margin--10"
          >{{ $t('Add Points to All Viewers') }}</button>
          <button
            @click="openResetLoyaltyHandler()"
            class="button button--soft-warning margin--10"
          >{{ $t('Reset Loyalty Database') }}</button>
        </div>
        <div class="flex flex--center">
          <div @click="onOpenLoyaltyPreferencesHandler()" class="loyalty-settings__button">
            <i class="icon-settings"></i>
            <span>{{ $t('Loyalty Settings') }}</span>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            class="chatbot__input--search width--auto margin--10"
            placeholder="Search User"
          >
        </div>
      </div>
      <div class="chatbot-list-placeholder__container" v-if="loyalty.length < 1">
        <img
          :src="require(`../../../../media/images/sleeping-kevin-${this.nightMode ? 'night' : 'day'}.png`)"
          width="200"
        >
        <span>{{ $t('No users in this list') }}</span>
      </div>
      <div class="padding--10 margin-horizontal--10" key="loyalty-table" v-else>
        <table>
          <thead>
            <tr>
              <th>{{ $t('Name') }}</th>
              <th>{{ $t('Points') }}</th>
              <th>{{ $t('Hours') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="data in loyalty" :key="data.id">
              <td>{{ $t(data.viewer.name) }}</td>
              <td>{{ data.points }}</td>
              <td>{{ (data.time / 60).toFixed(2) }}</td>
              <td>
                <div class="align-items--inline">
                  <i @click="onOpenLoyaltyDeleteHandler(data)" class="icon-trash padding--5 cursor--pointer"/>
                  <i @click="onOpenLoyaltyWindowHandler(data)" class="icon-edit padding--5 cursor--pointer"/>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <ChatbotPagination
          v-if="totalPages > 1"
          :totalPages="totalPages"
          :currentPage="currentPage"
          @change="fetchLoyalty"
        />
      </div>
      <ChatbotGenericModalWindow
        :name="ADD_LOYALTY_MODAL"
        :isInputModal="true"
        @ok="onOkHandler"
        @cancel="onCancelHandler"
        :message="$t('Amount')"
      />
      <ChatbotGenericModalWindow
        :name="CLEAR_LOYALTY_MODAL"
        :warn="true"
        @reset="onResetHandler"
        @cancel="onCancelHandler"
        :header="$t('Reset Loyalty Database')"
        :message="$t('Are you sure you want to reset your entire Loyalty database? This action is irreversible.')"
      />
      <ChatbotGenericModalWindow
        :name="DELETE_LOYALTY_MODAL"
        :warn="true"
        @ok="onDeleteHandler"
        @cancel="onCancelHandler"
        :header="loyaltyToDelete ?  $t('Delete {name}\'s Loyalty',{name: loyaltyToDelete.viewer.name}) : ''"
        :message="loyaltyToDelete ?$t('Are you sure you want to delete {name}\'s loyalty? This action is irreversible',{name: loyaltyToDelete.viewer.name}) : ''"
      />
    </div>
  </transition>
</template>

<script lang='ts' src="./ChatbotLoyalty.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';
.loyalty-image {
  .padding-left(2);
}

.chatbot-list-placeholder__container {
  .flex();
  .flex--column();
  .flex--center();
  .padding-vertical--20;
}

.chatbot-empty-placeholder__container {
  .flex();
  .flex--column();
  .flex__column();
  .flex--center();
}

.loyalty-settings__button {
  .padding-left();
  .cursor--pointer;
}

.loyalty-information__container {
  max-width: 275px;
  text-align: center;
}
</style>
