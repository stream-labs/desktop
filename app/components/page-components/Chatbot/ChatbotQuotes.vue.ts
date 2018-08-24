import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Watch } from 'vue-property-decorator';
import { IChatbotTimer, IQuote } from 'services/chatbot/chatbot-interfaces';
import { Debounce } from 'lodash-decorators';
import ChatbotPagination from 'components/page-components/Chatbot/shared/ChatbotPagination.vue';


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

  fetchQuotes(page = this.currentPage, query?: string) {
    this.chatbotApiService.fetchQuotes(page, query);
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
