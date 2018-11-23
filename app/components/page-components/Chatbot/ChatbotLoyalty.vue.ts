import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Watch } from 'vue-property-decorator';
import { Debounce } from 'lodash-decorators';
import ChatbotPagination from 'components/page-components/Chatbot/shared/ChatbotPagination.vue';
import { ILoyaltyData } from 'services/chatbot';

@Component({
  components: {
    ChatbotPagination
  }
})
export default class ChatbotLoyalty extends ChatbotBase {
  searchQuery = '';

  mounted() {
    this.fetchLoyalty(1);
    this.chatbotApiService.Loyalty.fetchLoyaltyPreferences();
  }

  get loyalty() {
    return this.chatbotApiService.Loyalty.state.loyaltyResponse.data;
  }

  onOpenLoyaltyPreferencesHandler() {
    this.chatbotApiService.Common.openLoyaltyPreferencesWindow();
  }

  onOpenLoyaltyAddWllHandler(){
    this.chatbotApiService.Common.openLoyaltyAddAllWindow();
  }

  onOpenLoyaltyWindowHandler(loyalty?: ILoyaltyData) {
    this.chatbotApiService.Common.openLoyaltyWindow(loyalty);
  }

  get totalPages() {
    return this.chatbotApiService.Loyalty.state.loyaltyResponse.pagination.total;
  }

  get currentPage() {
    return this.chatbotApiService.Loyalty.state.loyaltyResponse.pagination.current;
  }

  fetchLoyalty(page: number = this.currentPage, query?: string) {
    this.chatbotApiService.Loyalty.fetchLoyalty(page, query);
  }

  @Watch('searchQuery')
  @Debounce(1000)
  onQueryChangeHandler(value: string) {
    this.fetchLoyalty(this.currentPage, value);
  }
}
