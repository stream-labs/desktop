import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import Tabs from 'components/Tabs.vue';
import ChatbotDefaultCommands from 'components/page-components/Chatbot/Commands/ChatbotDefaultCommands.vue';
@Component({
  components: {
    Tabs,
    ChatbotDefaultCommands
  }
})
export default class ChatbotCommands extends Vue {
  tabs: { name: String; value: String }[] = [
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

  selectedTab: String = 'default';

  onSelectTab(tab: String) {
    this.selectedTab = tab;
  }
}


