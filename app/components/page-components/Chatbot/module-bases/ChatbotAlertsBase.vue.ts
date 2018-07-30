import _ from 'lodash';
import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import {
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

@Component({})
export default class ChatbotAlertsBase extends ChatbotWindowsBase {

  get chatAlerts() {
    return this.chatbotApiService.state.chat_alerts_response;
  }

  get chatAlertsEnabled() {
    return this.chatbotApiService.state.chat_alerts_response.enabled;
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

  // calls to service methods

  toggleEnableAlert(type: string) {
    const newAlertsObject: ChatAlertsResponse = _.cloneDeep(this.chatAlerts);
    const { parent, enabled } = this.typeKeys(type);
    newAlertsObject.settings[parent][enabled] = !this.chatAlerts.settings[parent][enabled];

    this.chatbotApiService.updateChatAlerts(newAlertsObject);
  }

  // add new alert
  addNewAlert(type: string, newAlert: any) {
    const newAlertsObject: ChatAlertsResponse = _.cloneDeep(this.chatAlerts);
    const { parent, messages } = this.typeKeys(type);

    if (type === 'subscriptions') {
      newAlertsObject.settings[parent][messages][newAlert.tier].push(newAlert);
    } else {
      newAlertsObject.settings[parent][messages].push(newAlert);
    }

    this.chatbotApiService
      .updateChatAlerts(newAlertsObject)
      .then(() => {
        this.$modal.hide('new-alert');
      });
  }
}

