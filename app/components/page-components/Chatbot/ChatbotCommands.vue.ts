import { Component, Prop } from 'vue-property-decorator';
import ChatbotDefaultCommands from 'components/page-components/Chatbot/Commands/ChatbotDefaultCommands.vue';
import ChatbotCustomCommands from 'components/page-components/Chatbot/Commands/ChatbotCustomCommands.vue';
import ChatbotCommandVariables from 'components/page-components/Chatbot/Commands/ChatbotCommandVariables.vue';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { ITab } from 'components/Tabs.vue';
@Component({
  components: {
    ChatbotDefaultCommands,
    ChatbotCustomCommands,
    ChatbotCommandVariables
  }
})
export default class ChatbotCommands extends ChatbotBase {
  tabs: ITab[] = [
    {
      name: 'Custom Commands',
      value: 'custom'
    },
    {
      name: 'Default Commands',
      value: 'default'
    },
    {
      name: 'Variables',
      value: 'variables'
    }
  ];

  selectedTab = 'custom';

  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }
}


