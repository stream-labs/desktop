import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import NavItem from 'components/shared/NavItem.vue';
import NavMenu from 'components/shared/NavMenu.vue';
import ChatbotModules from 'components/page-components/Chatbot/ChatbotModules.vue';

@Component({
  components: {
    NavMenu,
    NavItem,
    ChatbotModules
  }
})
export default class Chatbot extends Vue {
  icons: Dictionary<string> = {
    Modules: 'icon-widgets',
    Commands: 'icon-suggestions',
    Timers: 'icon-time',
    'Mod Tools': 'icon-settings-3-1'
  };
  data() {
    return {
      tabNames: ['Modules', 'Commands', 'Timers', 'Mod Tools'],
      selectedTab: 'Modules'
    };
  }
}


