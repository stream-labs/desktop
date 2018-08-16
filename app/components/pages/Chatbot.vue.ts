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

  //
  // Default State
  //
  icons: Dictionary<string> = {
    Modules: 'icon-widgets',
    Commands: 'icon-suggestions',
    Timers: 'icon-time',
    'Mod Tools': 'icon-settings-3-1'
  };

  tabNames = ['Modules', 'Commands', 'Timers', 'Mod Tools'];
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



