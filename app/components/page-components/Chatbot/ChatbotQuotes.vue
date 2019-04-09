<template>
  <div>
    <!-- batch actions -->
    <div class="flex flex--space-between padding--10">
      <button
        @click="onOpenQuoteWindowHandler"
        class="button button--action margin--10"
      >{{ $t('Add Quote') }}</button>
      <div class="flex">
        <button
          @click="onOpenQuotePreferencesHandler"
          class="button button--default margin--10"
        >{{ $t('Quote Preferences') }}</button>
        <input
          v-model="searchQuery"
          type="text"
          class="chatbot__input--search width--auto margin--10"
          placeholder="Search"
        >
      </div>
    </div>

    <empty-section
      v-if="!quotes || quotes.length === 0"
      :variation="'text'"
      :title="$t('You don\'t have any Quotes')"
      :subtitle="$t('Click Add Quote to get started or use !addquote <text> in chat')"
    ></empty-section>
    <div v-else class="padding--10 margin-horizontal--10">
      <table>
        <thead>
          <tr>
            <th>{{ $t("Id") }}</th>
            <th>{{ $t("Quote") }}</th>
            <th>{{ $t("Added By") }}</th>
            <th>{{ $t("Game") }}</th>
            <th>{{ $t("Date") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="quote in quotes" :key="quote.name">
            <td>{{ quote.custom_id }}</td>
            <td>{{ quote.message }}</td>
            <td>{{ quote.added_by }}</td>
            <td>{{ quote.game }}</td>
            <td>{{ formatDate(quote.created_at) || '-' }}</td>
            <td>
              <div class="align-items--inline">
                <i
                  @click="onDeleteQuoteHandler(quote)"
                  class="icon-trash padding--5 cursor--pointer"
                />
                <i
                  @click="onOpenQuoteWindowHandler(quote)"
                  class="icon-edit padding--5 cursor--pointer"
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
        @change="fetchQuotes"
      />
    </div>
    <!-- Modals -->
    <ChatbotGenericModalWindow
      :name="DELETE_MODAL"
      @yes="onYesHandler"
      @no="onNoHandler"
      :header="$t('Are you sure you want to delete Quote %{number}?',{number: selectedQuote ? selectedQuote.custom_id : ''})"
      :message="$t('Once deleted it can not be recovered.')"
    />
  </div>
</template>

<script lang='ts' src="./ChatbotQuotes.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';

tbody tr {
  td:nth-child(2) {
    width: 300px;
  }
  td:last-child:not(.text-align--center) {
    width: 100px;
    .align-items--inline;
    .text-align--right;
    padding-right: 10px;
  }
}

.icon-edit,
.icon-trash {
  .icon-hover();
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
