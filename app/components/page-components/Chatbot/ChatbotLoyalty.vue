<template>
<div>
  <!-- batch actions -->
  <div class="flex flex--space-between padding--10">
    <button
      @click="onOpenLoyaltyAddWllHandler()"
      class="button button--action margin--10"
    >
      {{ $t('Add Points to All Viewers') }}
    </button>
    <div class="flex flex--center">
      <div @click="onOpenLoyaltyPreferencesHandler()" class="loyalty-settings__button">
        <i class="icon-settings"></i> <span> {{ $t('Loyalty Settings') }} </span>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        class="chatbot__input--search width--auto margin--10"
        placeholder="Search User"
      />
    </div>
  </div>
  <!--<div class="chatbot-empty-placeholder__container">
    <img
      :src="require(`../../../../media/images/chatbot/chatbot-placeholder-timer--${this.nightMode ? 'night' : 'day'}.svg`)"
      width="200"
    />
    <h1>{{ $t('Loyalty') }}</h1>
    <span class="loyalty-information__container">{{ $t('Your viewers earn currency while you stream. They can use their currency\r\nin minigames, giveaways and to trigger commands.') }}</span>
    <button
      class="button button--action margin--10"
    >
      {{ $t('Enable Loyalty') }}
    </button>
  </div>-->
  <div class="padding--10">
      <table>
        <thead>
          <tr>
            <th> {{ $t('Name') }} </th>
            <th> {{ $t('Points') }} </th>
            <th> {{ $t('Hours') }} </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="data in loyalty"
            :key="data.id"
          >
            <td> {{ $t(data.viewer.name) }} </td>
            <td> {{ $t(data.points) }} </td>
            <td> {{ (data.time / 60).toFixed(2) }} </td>
            <td>
              <div class="align-items--inline">
                <i @click="onOpenLoyaltyWindowHandler(data)" class="icon-edit padding--5"/>
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
</div>
</template>

<script lang='ts' src="./ChatbotLoyalty.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';
.chatbot-empty-placeholder__container {
  .flex();
  .flex--column();
  .flex--center();
  .padding-vertical--20;
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
