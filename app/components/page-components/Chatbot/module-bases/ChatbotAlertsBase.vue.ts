import cloneDeep from 'lodash/cloneDeep';
import { Component } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import {
  IChatAlertsResponse,
  IAlertMessage,
  ChatbotAlertType,
  NEW_ALERT_MODAL_ID,
} from 'services/chatbot';

@Component({})
export default class ChatbotAlertsBase extends ChatbotWindowsBase {
  get chatAlerts() {
    return this.chatbotApiService.Alerts.state.chatAlertsResponse;
  }

  get chatAlertsEnabled() {
    return this.chatbotApiService.Alerts.state.chatAlertsResponse.enabled;
  }

  get alertTypes() {
    const { streamlabs, twitch, mixer, youtube } = this.chatAlerts.settings;

    const platform = this.chatbotApiService.Base.userService.platform.type;

    let alertTypes;

    switch (platform) {
      case 'twitch': {
        alertTypes = {
          ...streamlabs,
          ...twitch,
        };
        break;
      }
      case 'mixer': {
        alertTypes = {
          ...streamlabs,
          ...mixer,
        };
        break;
      }
      case 'youtube': {
        alertTypes = {
          ...streamlabs,
          ...youtube,
        };
        break;
      }
      default: {
        alertTypes = {
          ...streamlabs,
        };
        break;
      }
    }

    return alertTypes;
  }

  platformForAlertType(type: ChatbotAlertType) {
    if (type === 'tip') return 'streamlabs';
    return this.chatbotApiService.Base.userService.platform.type;
  }

  // preparing data to send to service

  // update/delete alert
  async spliceAlertMessages(
    type: ChatbotAlertType,
    index: number,
    updatedAlert: IAlertMessage,
    tier?: string,
  ) {
    const newAlertsObject: IChatAlertsResponse = cloneDeep(this.chatAlerts);
    const platform = this.platformForAlertType(type);

    newAlertsObject.settings[platform][type].messages.splice(index, 1);
    if (updatedAlert) {
      newAlertsObject.settings[platform][type].messages.splice(index, 0, updatedAlert);
    }

    this.updateChatAlerts(newAlertsObject);
    await this.$modal.hide(NEW_ALERT_MODAL_ID);
  }

  // toggle enable type
  async onToggleEnableAlertHandler(type: ChatbotAlertType) {
    const newAlertsObject: IChatAlertsResponse = cloneDeep(this.chatAlerts);
    const platform = this.platformForAlertType(type);

    newAlertsObject.settings[platform][type].enabled = !this.chatAlerts.settings[platform][type]
      .enabled;

    this.updateChatAlerts(newAlertsObject);
  }

  // add new alert
  async addNewAlert(type: ChatbotAlertType, newAlert: IAlertMessage) {
    const newAlertsObject: IChatAlertsResponse = cloneDeep(this.chatAlerts);
    const platform = this.platformForAlertType(type);

    newAlertsObject.settings[platform][type].messages.push(newAlert);

    this.updateChatAlerts(newAlertsObject);
    await this.$modal.hide(NEW_ALERT_MODAL_ID);
  }

  // calls to service methods
  updateChatAlerts(newAlertsObject: IChatAlertsResponse) {
    return this.chatbotApiService.Alerts.updateChatAlerts(newAlertsObject);
  }
}
