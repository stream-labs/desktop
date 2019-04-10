import { Component, Watch } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { ModalComp, EmptySection } from 'streamlabs-beaker';
import { IManagedUser } from 'services/chatbot';
import { Debounce } from 'lodash-decorators';

@Component({
  components: { ModalComp, EmptySection },
})
export default class ChatbotUserManagement extends ChatbotBase {
  searchQuery = '';
  selectedUser: IManagedUser = null;

  mounted() {
    this.fetchRegulars();
  }

  get users() {
    return this.chatbotApiService.UserManagement.state.regularsResponse;
  }

  get platform() {
    return this.chatbotApiService.Base.userService.platform.type;
  }

  get currentPage() {
    return this.chatbotApiService.Commands.state.customCommandsResponse.pagination.current;
  }

  get totalPages() {
    return this.chatbotApiService.Commands.state.customCommandsResponse.pagination.total;
  }

  openDeleteModal(user: IManagedUser) {
    this.selectedUser = user;
    this.$modal.show('modal-confirmation');
  }

  openAddModal(user?: IManagedUser) {
    this.chatbotApiService.Common.openRegularWindow(user);
  }

  onDeleteUser() {
    this.chatbotApiService.UserManagement.deleteRegular(this.selectedUser.id);
  }

  fetchRegulars(page: number = this.currentPage, query: string = this.searchQuery) {
    this.chatbotApiService.UserManagement.fetchRegulars(page, query);
  }

  @Watch('searchQuery')
  @Debounce(1000)
  onQueryChangeHandler(value: string) {
    this.fetchRegulars(this.currentPage, value);
  }
}
