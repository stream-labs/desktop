import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Watch } from 'vue-property-decorator';
import { IQuote, DELETE_MODAL } from 'services/chatbot';
import { Debounce } from 'lodash-decorators';
import ChatbotPagination from 'components/page-components/Chatbot/shared/ChatbotPagination.vue';
import moment from 'moment';
import ChatbotGenericModalWindow from './windows/ChatbotGenericModalWindow.vue';
import { EmptySection } from 'streamlabs-beaker';

@Component({
  components: {
    ChatbotPagination,
    ChatbotGenericModalWindow,
    EmptySection,
  },
})
export default class ChatbotQuotes extends ChatbotBase {
  searchQuery: string = '';
  selectedQuote: IQuote = null;

  get quotes() {
    return this.chatbotApiService.Quotes.state.quotesResponse.data;
  }

  get currentPage(): number {
    return this.chatbotApiService.Quotes.state.quotesResponse.pagination.current;
  }

  get totalPages(): number {
    return this.chatbotApiService.Quotes.state.quotesResponse.pagination.total;
  }

  get DELETE_MODAL() {
    return `${DELETE_MODAL}-quote`;
  }

  mounted() {
    // get list of quotes
    this.fetchQuotes(1);
    this.chatbotApiService.Quotes.fetchQuotePreferences();
  }

  @Watch('searchQuery')
  @Debounce(1000)
  onQueryChangeHandler(value: string) {
    this.fetchQuotes(this.currentPage, value);
  }

  get quotePreferences() {
    return this.chatbotApiService.Quotes.state.quotePreferencesResponse;
  }

  fetchQuotes(page = this.currentPage, query = this.searchQuery) {
    this.chatbotApiService.Quotes.fetchQuotes(page, query);
  }

  formatDate(dateString: string) {
    return moment(dateString).format(this.quotePreferences.settings.general.date_format);
  }

  onOpenQuoteWindowHandler(quote?: IQuote) {
    this.chatbotApiService.Common.openQuoteWindow(quote);
  }

  onOpenQuotePreferencesHandler() {
    this.chatbotApiService.Common.openQuotePreferencesWindow();
  }

  onDeleteQuoteHandler(quote?: IQuote) {
    this.selectedQuote = quote;
    this.chatbotApiService.Common.closeChatbotChildWindow();
    this.$modal.show(this.DELETE_MODAL);
  }

  onYesHandler() {
    if (this.selectedQuote) {
      this.chatbotApiService.Quotes.deleteQuote(this.selectedQuote.id);
    }
  }

  onNoHandler() {
    this.selectedQuote = null;
  }
}
