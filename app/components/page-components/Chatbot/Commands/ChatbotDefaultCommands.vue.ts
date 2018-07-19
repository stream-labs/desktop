import ChatbotCommandsBase from 'components/page-components/Chatbot/Commands/ChatbotCommandsBase.vue';
import { Component } from 'vue-property-decorator';
import Tabs from 'components/Tabs.vue';

interface StaticPermission {
  level: number;
}

interface CommandRow {
  command: string;
  description: string;
  response_type: string;
  aliases: string[];
  success_response?: string;
  failed_response?: string;
  response?: string;
  static_permission?: StaticPermission;
  enabled?: boolean;
  enabled_response?: string;
  disabled_response?: string;
}

interface Slug {
  [id: string]: CommandRow;
}

interface ApiGetResponse {
  'commands': Slug;
  'link-protection': Slug;
  'giveaway': Slug;
}

@Component({
  components: {
    Tabs
  }
})
export default class ChatbotDefaultCommands extends ChatbotCommandsBase {
  commandSlugs: ApiGetResponse = null;

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
      .then(response => {
        console.log(response);
        this.commandSlugs = response;
      })
      .catch(err => {
        alert('Error fetching default commands');
      });
  }

}
