import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import ChatbotExtensionModal from './ChatbotExtensionModal.vue';
import ChatbotStreamElementsModal from './ChatbotStreamElementsModal.vue';

@Component({
  components: {
    ChatbotExtensionModal,
    ChatbotStreamElementsModal,
  },
})
export default class ChatbotLoyaltyImporter extends ChatbotBase {
  mounted() {
    this.chatbotApiService.Importer.fetchImporterStatus();
  }

  get statusResponse() {
    return this.chatbotApiService.Importer.state.statusResponse;
  }

  importExtensionHandler() {
    this.$modal.show('extension-modal');
  }

  importStreamElementsHandler() {
    this.$modal.show('streamelements-modal');
  }
}
