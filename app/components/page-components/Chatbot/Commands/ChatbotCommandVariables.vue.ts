import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';

@Component({})
export default class ChatbotDefaultCommands extends ChatbotBase {

  get variables() {
    return this.chatbotApiService.state.command_variables_response;
  }

  mounted() {
    //
    // get list of user's custom commands
    //
    this.chatbotApiService.fetchCommandVariables();
  }
}
