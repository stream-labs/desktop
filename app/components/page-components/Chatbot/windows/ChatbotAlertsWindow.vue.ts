import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import NavItem from 'components/shared/NavItem.vue';
import NavMenu from 'components/shared/NavMenu.vue';

import {
  FollowAlert,
  SubAlert,
  TipAlert,
  HostAlert,
  RaidAlert
} from 'services/chatbot/chatbot-interfaces';


interface AlertWindowData {
  followers: FollowAlert;
  subscriptions: SubAlert;
  donations: TipAlert;
  hosts: HostAlert;
  raids: RaidAlert;
}

@Component({
  components: {
    NavMenu,
    NavItem,
  }
})
export default class ChatbotTimerWindow extends ChatbotWindowsBase {
  selectedTab = 'followers';

  get chatAlerts() {
    return this.chatbotApiService.state.chat_alerts_response;
  }

  get selectedTabData() {
    // return { use_***, ***_messages };
    return this.tabs[this.selectedTab];
  }

  get selectedTabMessages() {
    // return { title: [messages] }
    // default title is all_alerts;

    const messageKey = Object
      .keys(this.selectedTabData)
      .find((key: string) => key.indexOf('messages') > -1);
    const messages = this.selectedTabData[messageKey];
    if (this.selectedTab === 'subscriptions') {
      return messages;
    }
    if (this.selectedTab === 'followers') {
      return {
        all_alerts: messages.map((message: string) => ({message}))
      }
    }
    return { all_alerts: messages };
  }

  get selectedTabTableTitles() {
    return Object.keys(this.selectedTabMessages);
  }

  get selectedTabTableColumns() {
    const firstKey = this.selectedTabTableTitles[0];
    const message = this.selectedTabMessages[firstKey][0];
    if (message) return Object.keys(message);

    return [];
  }


  get tabs() {
    const {
      use_tip,
      tip_messages
    } = this.chatAlerts.settings.streamlabs;

    const {
      use_follow,
      follow_messages,
      use_host,
      host_messages,
      use_raid,
      raid_messages,
      use_sub,
      subscriber_messages
    } = this.chatAlerts.settings.twitch;

    const tabs: AlertWindowData = {
      followers: { use_follow, follow_messages },
      subscriptions: { use_sub, subscriber_messages },
      donations: { use_tip, tip_messages },
      hosts: { use_host, host_messages } ,
      raids: { use_raid, raid_messages },
    }
    return tabs;
  }

  onDone() {
    this.chatbotCommonService.closeChildWindow();
  }
}
