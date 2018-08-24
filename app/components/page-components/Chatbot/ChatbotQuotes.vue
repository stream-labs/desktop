<template>
<div>
  <!-- batch actions -->
  <div class="flex flex--space-between padding--10">
    <button
      @click="onOpenQuoteWindowHandler"
      class="button button--action margin--10"
    >
      {{ $t('Add Quote') }}
    </button>
    <div class="flex">
      <button
        @click="onOpenQuotePreferencesHandler"
        class="button button--default margin--10"
      >
        {{ $t('Quote Preferences') }}
      </button>
      <input
        v-model="searchQuery"
        type="text"
        class="chatbot__input--search width--auto margin--10"
        placeholder="Search"
      />
    </div>
  </div>
  <div v-if="!quotes || quotes.length === 0" class="chatbot-empty-placeholder__container">
    <img
      :src="require(`../../../../media/images/chatbot/chatbot-placeholder-timer--${this.nightMode ? 'night' : 'day'}.svg`)"
      width="200"
    />
    <span>{{ $t('Click add quote to get started.') }}</span>
  </div>
  <div v-else class="padding--10">
    <table>
      <thead>
        <tr>
          <th> {{ $t("id") }} </th>
          <th> {{ $t("quote") }} </th>
          <th> {{ $t("added by") }} </th>
          <th> {{ $t("game") }} </th>
          <th> {{ $t("date") }} </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="quote in quotes"
          :key="quote.name"
        >
          <td> {{ quote.custom_id }} </td>
          <td> {{ quote.message }} </td>
          <td> {{ quote.added_by }} </td>
          <td> {{ quote.game }} </td>
          <td> {{ quote.created_at || '-' }} </td>
          <td>
            <div class="align-items--inline">
              <i @click="onOpenQuoteWindowHandler(quote)" class="icon-edit padding--5"/>
              <i @click="onDeleteQuoteHandler(quote)" class="icon-trash padding--5"/>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <ChatbotPagination
      v-if="totalPages > 1"
      :totalPages="totalPages"
      :currentPage="currentPage"
      @change="fetchQuotes"
    />
  </div>
</div>
</template>

<script lang='ts' src="./ChatbotQuotes.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.chatbot-empty-placeholder__container {
  .flex();
  .flex--column();
  .flex--center();
  .padding-vertical--20;
}

tbody tr {
  .transition;
  .cursor--pointer;

  td {
    color: black;
  }

  td:nth-child(2) {
    width: 300px;
  }
  td:last-child:not(.text-align--center) {
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



.night-theme {
  td {
    .transition;
    color: white;
  }

  tbody tr {
    border: 2px solid transparent;
    .transition;
    .cursor--pointer;
    color: white;
  }
  tbody tr:nth-child(odd) {
    background-color: @navy-secondary;
  }
  tbody tr:nth-child(even) {
    background-color: @navy;
  }
}
</style>
