import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import NavItem from '../shared/NavItem.vue';
import NavMenu from '../shared/NavMenu.vue';
import ChatbotModules from '../page-components/Chatbot/ChatbotModules.vue';
import ChatbotCommands from '../page-components/Chatbot/ChatbotCommands.vue';
import ChatbotModTools from '../page-components/Chatbot/ChatbotModTools.vue';
import ChatbotTimers from '../page-components/Chatbot/ChatbotTimers.vue';
import { ChatbotApiService } from 'services/chatbot-api';
import { Inject } from 'util/injector';

interface AuthResponse {
  api_token: string;
  socket_token: string;
}

@Component({
  components: {
    NavMenu,
    NavItem,
    ChatbotModules,
    ChatbotCommands,
    ChatbotTimers,
    ChatbotModTools
  }
})
export default class Chatbot extends Vue {
  @Inject() chatbotApiService: ChatbotApiService;

  icons: Dictionary<string> = {
    Modules: 'icon-widgets',
    Commands: 'icon-suggestions',
    Timers: 'icon-time',
    'Mod Tools': 'icon-settings-3-1'
  };

  tabNames = ['Modules', 'Commands', 'Timers', 'Mod Tools'];
  selectedTab = 'Commands';
  authenticated = false;

  mounted() {
    this.chatbotApiService.logIn()
      .then((response: AuthResponse) => {
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



