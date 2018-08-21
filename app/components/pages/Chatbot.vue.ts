import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import NavItem from 'components/shared/NavItem.vue';
import NavMenu from 'components/shared/NavMenu.vue';
import ChatbotModules from 'components/page-components/Chatbot/ChatbotModules.vue';
import ChatbotCommands from 'components/page-components/Chatbot/ChatbotCommands.vue';
import ChatbotModTools from 'components/page-components/Chatbot/ChatbotModTools.vue';
import ChatbotTimers from 'components/page-components/Chatbot/ChatbotTimers.vue';
import { ChatbotApiService } from 'services/chatbot/chatbot';
import { Inject } from 'util/injector';
import ToggleInput from 'components/shared/inputs/ToggleInput.vue'

@Component({
  components: {
    NavMenu,
    NavItem,
    ChatbotModules,
    ChatbotCommands,
    ChatbotTimers,
    ChatbotModTools,
    ToggleInput
  }
})
export default class Chatbot extends Vue {
  @Inject()
  chatbotApiService: ChatbotApiService;

  tabNames = [
    {title: 'Modules', enabled: true},
    {title: 'Commands', enabled: true},
    {title: 'Timers', enabled: true},
    { title: 'Mod Tools', enabled: true},
    {title: 'Quotes', enabled: false},
    {title: 'Queue', enabled: false},
    {title: 'Currency', enabled: false},
    {title: 'Poll', enabled: false},
    {title: 'Betting', enabled: false},
  ];
  //
  // Default State
  //
  icons: Dictionary<string> = {
    Modules: 'icon-widgets',
    Commands: 'icon-suggestions',
    Timers: 'icon-time',
    'Mod Tools': 'icon-settings-3-1',
    Quotes: 'fas fa-quote-left',
    Queue: 'fas fa-list-ul',
    Currency: 'fas fa-dollar-sign',
    Poll: 'icon-suggestions',
    Betting: 'fas fa-money-bill-wave'
  };

  selectedTab = 'Modules';
  authenticated = false;

  enabled = false;

  get globallyEnabled() {
    return this.chatbotApiService.state.globallyEnabled;
  }

  toggleEnableChatbot() {
    this.chatbotApiService.toggleEnableChatbot();
  }

  mounted() {
    this.chatbotApiService
      .logIn()
      .then(response => {
        // user has authenticated chatbot api,
        // opening commands tab which will internally call
        // chatbotApiService interally to fetch chatbots
        this.authenticated = true;
      })
      .catch(err => {
        alert('Error authorizing you into chatbot');
      });
  }
}



