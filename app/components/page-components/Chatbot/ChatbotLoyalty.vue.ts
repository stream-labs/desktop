import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Watch } from 'vue-property-decorator';
import { Debounce } from 'lodash-decorators';
import ChatbotPagination from 'components/page-components/Chatbot/shared/ChatbotPagination.vue';
import { IChatbotLoyalty } from 'services/chatbot';
import ChatbotGenericModalWindow from './windows/ChatbotGenericModalWindow.vue';
import { EmptySection } from 'streamlabs-beaker';
import { Inject } from 'services/core/injector';
import { CustomizationService } from 'services/customization';

@Component({
  components: {
    ChatbotPagination,
    ChatbotGenericModalWindow,
    EmptySection,
  },
})
export default class ChatbotLoyalty extends ChatbotBase {
  searchQuery = '';
  loyaltyToDelete: IChatbotLoyalty = null;
  @Inject() customizationService: CustomizationService;

  mounted() {
    this.fetchLoyalty(1);
    this.chatbotApiService.Loyalty.fetchLoyaltyPreferences();
  }

  get loyalty() {
    return this.chatbotApiService.Loyalty.state.loyaltyResponse.data;
  }

  get ADD_LOYALTY_MODAL() {
    return 'add-loyalty';
  }

  get CLEAR_LOYALTY_MODAL() {
    return 'clear-loyalty';
  }

  get DELETE_LOYALTY_MODAL() {
    return 'delete-loyalty';
  }

  get nightMode() {
    return this.customizationService.isDarkTheme;
  }

  onOpenLoyaltyPreferencesHandler() {
    this.chatbotApiService.Common.openLoyaltyPreferencesWindow();
  }

  onOpenLoyaltyAddallHandler() {
    this.$modal.show(this.ADD_LOYALTY_MODAL);
  }

  openResetLoyaltyHandler() {
    this.$modal.show(this.CLEAR_LOYALTY_MODAL);
  }

  onEnableLoyaltyHandler() {
    const newSettings = this.chatbotApiService.Loyalty.state.loyaltyPreferencesResponse;
    newSettings.enabled = true;
    this.chatbotApiService.Loyalty.updateLoyaltyPreferences(newSettings, false);
  }

  onOpenLoyaltyWindowHandler(loyalty?: IChatbotLoyalty) {
    this.chatbotApiService.Common.openLoyaltyWindow(loyalty);
  }

  onOpenLoyaltyDeleteHandler(loyalty: IChatbotLoyalty) {
    this.loyaltyToDelete = loyalty;
    this.$modal.show(this.DELETE_LOYALTY_MODAL);
  }

  get totalPages() {
    return this.chatbotApiService.Loyalty.state.loyaltyResponse.pagination.total;
  }

  get enabled() {
    return this.chatbotApiService.Loyalty.state.loyaltyPreferencesResponse.enabled;
  }

  get currentPage() {
    return this.chatbotApiService.Loyalty.state.loyaltyResponse.pagination.current;
  }

  fetchLoyalty(page: number = this.currentPage, query?: string) {
    this.chatbotApiService.Loyalty.fetchLoyalty(page, query);
  }

  onOkHandler(value: number) {
    this.chatbotApiService.Loyalty.addToAll(value);
  }

  onResetHandler() {
    this.chatbotApiService.Loyalty.clear();
  }

  onDeleteHandler() {
    if (this.loyaltyToDelete) {
      this.chatbotApiService.Loyalty.delete(this.loyaltyToDelete.id);
    }
  }

  onCancelHandler() {}

  @Watch('searchQuery')
  @Debounce(1000)
  onQueryChangeHandler(value: string) {
    this.fetchLoyalty(this.currentPage, value);
  }
}
