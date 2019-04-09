import { Component } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { ModalComp, EmptySection } from 'streamlabs-beaker';
import { IManagedUser } from 'services/chatbot';

@Component({
  components: { ModalComp, EmptySection },
})
export default class ChatbotUserManagement extends ChatbotBase {
  searchQuery = '';
  selectedUser: IManagedUser = null;

  mounted() {
    this.chatbotApiService.UserManagement.fetchRegulars(1, this.searchQuery);
  }

  get users() {
    return this.chatbotApiService.UserManagement.state.regularsResponse;
  }

  get platform() {
    return this.chatbotApiService.Base.userService.platform.type;
  }

  openDeleteModal(user: IManagedUser) {
    this.selectedUser = user;
    this.$modal.show('modal-confirmation');
  }
  onDeleteUser() {
    this.chatbotApiService.UserManagement.deleteRegular(this.selectedUser.id);
  }
}
