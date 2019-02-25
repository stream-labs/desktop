import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import NavItem from 'components/shared/NavItem.vue';
import NavMenu from 'components/shared/NavMenu.vue';
import ChatbotModules from 'components/page-components/Chatbot/ChatbotModules.vue';
import ChatbotCustomCommands from 'components/page-components/Chatbot/ChatbotCustomCommands.vue';
import ChatbotDefaultCommands from 'components/page-components/Chatbot/ChatbotDefaultCommands.vue';
import ChatbotCommandVariables from 'components/page-components/Chatbot/ChatbotCommandVariables.vue';
import ChatbotModTools from 'components/page-components/Chatbot/ChatbotModTools.vue';
import ChatbotTimers from 'components/page-components/Chatbot/ChatbotTimers.vue';
import ChatbotQuotes from 'components/page-components/Chatbot/ChatbotQuotes.vue';
import ChatbotQueue from 'components/page-components/Chatbot/ChatbotQueue.vue';
import { ChatbotApiService } from 'services/chatbot';
import { Inject } from 'util/injector';
import ToggleInput from 'components/shared/inputs/ToggleInput';
import ChatbotBanner from 'components/page-components/Chatbot/shared/ChatbotBanner.vue';

@Component({
  components: {
    NavMenu,
    NavItem,
    ChatbotModules,
    ChatbotCustomCommands,
    ChatbotDefaultCommands,
    ChatbotCommandVariables,
    ChatbotTimers,
    ChatbotModTools,
    ChatbotQuotes,
    ChatbotQueue,
    ToggleInput,
    ChatbotBanner,
  },
})
export default class Chatbot extends Vue {
  @Inject() chatbotApiService: ChatbotApiService;

  tabNames = [
    { title: 'Modules', enabled: true },
    {
      title: 'Commands',
      enabled: true,
      children: [
        { title: 'Custom Commands' },
        { title: 'Default Commands' },
        { title: 'Variables' },
      ],
    },
    { title: 'Timers', enabled: true },
    { title: 'Mod Tools', enabled: true },
    { title: 'Quotes', enabled: false },
    { title: 'Queue', enabled: false },
    { title: 'Currency', enabled: false },
    { title: 'Poll', enabled: false },
    { title: 'Betting', enabled: false },
  ];

  //
  // Default State
  //
  icons: Dictionary<string> = {
    Modules: 'icon-widgets',
    Commands: 'icon-suggestions',
    Timers: 'icon-time',
    'Mod Tools': 'fas fa-ban',
    Quotes: 'fas fa-quote-left',
    Queue: 'fas fa-list-ul',
    Currency: 'fas fa-dollar-sign',
    Poll: 'icon-suggestions',
    Betting: 'fas fa-money-bill-wave',
  };

  selectedTab = 'Modules';
  authenticated = false;

  enabled = false;

  get globallyEnabled() {
    return this.chatbotApiService.state.globallyEnabled;
  }

  onToggleEnableChatbotHandler() {
    this.chatbotApiService.toggleEnableChatbot();
  }

  mounted() {
    this.chatbotApiService
      .logIn()
      .then(response => {
        this.authenticated = true;
      })
      .catch(err => {
        alert('Error authorizing you into chatbot');
      });
  }
}
