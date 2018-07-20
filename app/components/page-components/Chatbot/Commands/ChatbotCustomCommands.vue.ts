import ChatbotCommandsBase from 'components/page-components/Chatbot/Commands/ChatbotCommandsBase.vue';
import { Component } from 'vue-property-decorator';
import {
  DafaultCommandsResponse,
  ChatbotAPIPostResponse
} from 'services/chatbot/chatbot-interfaces';


@Component({})
export default class ChatbotDefaultCommands extends ChatbotCommandsBase {
  commandSlugs: DafaultCommandsResponse = null;

  mounted() {
    //
    // get list of user's default commands
    //
    this.fetchCommands();
  }

  fetchCommands() {
    // fetch default commands
    this.chatbotApiService
      .fetchDefaultCommands()
      .then((response: DafaultCommandsResponse) => {
        console.log(response);
        this.commandSlugs = response;
      })
      .catch(err => {
        alert('Error fetching default commands');
      });
  }

  toggleEnableCommand(slugName: string, commandName: string, isEnabled: boolean) {
    const updatedCommand = {
      ...this.commandSlugs[slugName][commandName],
      enabled: isEnabled
    };
    this.chatbotApiService
      .updateDefaultCommand(slugName, commandName, updatedCommand)
      .then((response: ChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.commandSlugs[slugName][commandName].enabled = isEnabled;
        }
      })
      .catch(err => {
        alert('Error updating command');
      });
  }
}
