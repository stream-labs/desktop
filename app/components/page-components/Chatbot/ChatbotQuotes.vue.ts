import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Watch } from 'vue-property-decorator';
import { IQuote } from 'services/chatbot/chatbot-interfaces';
import { Debounce } from 'lodash-decorators';
import ChatbotPagination from 'components/page-components/Chatbot/shared/ChatbotPagination.vue';
import moment from 'moment';


@Component({
  components: {
    ChatbotPagination
  }
})
export default class ChatbotQuotes extends ChatbotBase {
  searchQuery = '';

  get quotes() {
    return this.chatbotApiService.state.quotesResponse.data;
  }

  get currentPage(): number {
    return this.chatbotApiService.state.quotesResponse.pagination.current;
  }

  get totalPages(): number {
    return this.chatbotApiService.state.quotesResponse.pagination.total;
  }

  mounted() {
    // get list of quotes
    this.fetchQuotes(1);
    this.chatbotApiService.fetchQuotePreferences();
  }

  @Watch('searchQuery')
  @Debounce(1000)
  onQueryChangeHandler(value: string) {
    this.fetchQuotes(this.currentPage, value);
  }

  get quotePreferences() {
    return this.chatbotApiService.state.quotePreferencesResponse;
  }

  fetchQuotes(page = this.currentPage, query = this.searchQuery) {
    this.chatbotApiService.fetchQuotes(page, query);
  }

  formatDate(dateString: string) {
    return moment(dateString).format(this.quotePreferences.settings.general.date_format);
  }

  onOpenQuoteWindowHandler(quote?: IQuote) {
    this.chatbotCommonService.openQuoteWindow(quote);
  }

  onOpenQuotePreferencesHandler() {
    this.chatbotCommonService.openQuotePreferenceWindow();
  }

  onDeleteQuoteHandler(quote?: IQuote) {
    this.chatbotApiService.deleteQuote(quote.id);
  }
}
