import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Watch } from 'vue-property-decorator';
import { Debounce } from 'lodash-decorators';
import ChatbotPagination from 'components/page-components/Chatbot/shared/ChatbotPagination.vue';
import { ILoyaltyData } from 'services/chatbot';
import ChatbotGenericModalWindow from './windows/ChatbotGenericModalWindow.vue';

@Component({
  components: {
    ChatbotPagination,
    ChatbotGenericModalWindow
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

  get ADD_LOYALTY_MODAL(){
    return 'add-loyalty';
  }

  onOpenLoyaltyPreferencesHandler() {
    this.chatbotApiService.Common.openLoyaltyPreferencesWindow();
  }

  onOpenLoyaltyAddWllHandler(){
    this.$modal.show(this.ADD_LOYALTY_MODAL);
    //this.chatbotApiService.Common.openLoyaltyAddAllWindow();
  }

  onEnableLoyaltyHandler(){
    let newSettings = this.chatbotApiService.Loyalty.state.loyaltyPreferencesResponse;
    newSettings.enabled = true;
    this.chatbotApiService.Loyalty.updateLoyaltyPreferences(newSettings, false);
  }

  onOpenLoyaltyWindowHandler(loyalty?: ILoyaltyData) {
    this.chatbotApiService.Common.openLoyaltyWindow(loyalty);
  }

  get totalPages() {
    return this.chatbotApiService.Loyalty.state.loyaltyResponse.pagination.total;
  }

  get enabled(){
    return this.chatbotApiService.Loyalty.state.loyaltyPreferencesResponse.enabled;
  }

  get currentPage() {
    return this.chatbotApiService.Loyalty.state.loyaltyResponse.pagination.current;
  }

  fetchLoyalty(page: number = this.currentPage, query?: string) {
    this.chatbotApiService.Loyalty.fetchLoyalty(page, query);
  }

  onOkHandler(value: number){
    console.log(value);
    console.log('Add Currency API Call');
  }

  onCancelHandler(){}

  @Watch('searchQuery')
  @Debounce(1000)
  onQueryChangeHandler(value: string) {
    this.fetchLoyalty(this.currentPage, value);
  }
}
