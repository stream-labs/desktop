import _ from 'lodash';
import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import ChatbotAlertsBase from 'components/page-components/Chatbot/module-bases/ChatbotAlertsBase.vue';
import NavItem from 'components/shared/NavItem.vue';
import NavMenu from 'components/shared/NavMenu.vue';

import {
  TwitchChatAlert,
  StreamlabsChatAlert,
  FollowAlert,
  SubAlert,
  TipAlert,
  HostAlert,
  RaidAlert,
  ChatAlertsResponse
} from 'services/chatbot/chatbot-interfaces';


interface AlertWindowData {
  followers: FollowAlert;
  subscriptions: SubAlert;
  donations: TipAlert;
  hosts: HostAlert;
  raids: RaidAlert;
}

interface AlertType {
  name: string,
  data: {
    [id: string]: any
  }
}

@Component({
  components: {
    NavMenu,
    NavItem
  },
  filters: {
    formatTextFromSnakeCase: function(text: string) {
      if (!text) return '';
      return text.split('_').join(' ');
    },
    formatTextBasedOnType: function(value: any) {
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value;
      if (typeof value === 'boolean') return value === true ? 'Yes' : 'No';
    },
    formatNumber: function(value: any, dp?: number) {
      if (isNaN(Number(value))) {
        return value;
      }

      if (dp === undefined) dp = 2;

      return value.toLocaleString(undefined, {
        maximumFractionDigits: dp,
        minimumFractionDigits: dp
      });
    }
  }
})
export default class ChatbotAlertsWindow extends ChatbotAlertsBase {
  selectedType = 'followers';

  get selectedTypeData() {
    // return { use_***, ***_messages };
    return this.alertTypes[this.selectedType];
  }

  get selectedTypeMessages() {
    // return { title: [messages] }
    // default title is all_alerts;

    const messageKey = Object.keys(this.selectedTypeData).find(
      (key: string) => key.indexOf('messages') > -1
    );
    const messages = this.selectedTypeData[messageKey];
    if (this.selectedType === 'subscriptions') {
      return messages;
    }
    if (this.selectedType === 'followers') {
      return {
        all_alerts: messages.map((message: string) => ({ message }))
      };
    }
    return { all_alerts: messages };
  }

  get selectedTypeTableTitles() {
    return Object.keys(this.selectedTypeMessages);
  }

  get selectedTypeTableColumns() {
    const firstKey = this.selectedTypeTableTitles[0];
    const message = this.selectedTypeMessages[firstKey][0];
    if (message) return Object.keys(message);

    return [];
  }

  get alertTypes() {
    const { use_tip, tip_messages } = this.chatAlerts.settings.streamlabs;

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

    const types: AlertWindowData = {
      followers: { use_follow, follow_messages },
      subscriptions: { use_sub, subscriber_messages },
      donations: { use_tip, tip_messages },
      hosts: { use_host, host_messages },
      raids: { use_raid, raid_messages }
    };
    return types;
  }

  typeKeys(type: string) {
    let data = this.alertTypes[type];
    const keys = Object.keys(data);
    return {
      parent: this.platformForAlertType(type),
      enabled: keys.find(key => key.indexOf('use') > -1),
      messages: keys.find(key => key.indexOf('message') > -1)
    };
  }

  platformForAlertType(type: string) {
    if (type === 'donations') return 'streamlabs';
    return 'twitch';
  }

  isEnabled(type: string) {
    return this.alertTypes[type][this.typeKeys(type).enabled];
  }

  toggleEnableAlert(type: string) {
    const newAlertsObject: ChatAlertsResponse  = _.cloneDeep(this.chatAlerts);
    const { parent, enabled, messages } = this.typeKeys(type);
    newAlertsObject.settings[parent][enabled] = !this.chatAlerts.settings[parent][enabled];

    this.chatbotApiService.updateChatAlerts(newAlertsObject);
  }

  onDone() {
    this.chatbotCommonService.closeChildWindow();
  }
}
