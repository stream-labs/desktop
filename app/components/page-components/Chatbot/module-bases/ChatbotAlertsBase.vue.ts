import { cloneDeep } from 'lodash';
import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import {
  IChatAlertsResponse,
  IAlertMessage,
  ChatbotAlertTypes,
  NEW_ALERT_MODAL_ID
} from 'services/chatbot/chatbot-interfaces';

@Component({})
export default class ChatbotAlertsBase extends ChatbotWindowsBase {
  get chatAlerts() {
    return this.chatbotApiService.state.chatAlertsResponse;
  }

  get chatAlertsEnabled() {
    return this.chatbotApiService.state.chatAlertsResponse.enabled;
  }

  get alertTypes() {
    const { streamlabs, twitch } = this.chatAlerts.settings;
    let alertTypes = {
      ...streamlabs,
      ...twitch
    };
    return alertTypes;
  }

  platformForAlertType(type: ChatbotAlertTypes) {
    if (type === 'tip') return 'streamlabs';
    return 'twitch';
  }

  // preparing data to send to service

  // update/delete alert
  async spliceAlertMessages(
    type: ChatbotAlertTypes,
    index: number,
    updatedAlert: IAlertMessage,
    tier?: string
  ) {
    const newAlertsObject: IChatAlertsResponse = cloneDeep(this.chatAlerts);
    const platform = this.platformForAlertType(type);

    newAlertsObject.settings[platform][type].messages.splice(index, 1);
    if (updatedAlert) {
      newAlertsObject.settings[platform][type].messages.splice(
        index,
        0,
        updatedAlert
      );
    }

    this.updateChatAlerts(newAlertsObject);
    await this.$modal.hide(NEW_ALERT_MODAL_ID);
  }

  // toggle enable type
  async toggleEnableAlert(type: ChatbotAlertTypes) {
    const newAlertsObject: IChatAlertsResponse = cloneDeep(this.chatAlerts);
    const platform = this.platformForAlertType(type);

    newAlertsObject.settings[platform][type].enabled = !this.chatAlerts
      .settings[platform][type].enabled;

    this.updateChatAlerts(newAlertsObject);
  }

  // add new alert
  async addNewAlert(type: ChatbotAlertTypes, newAlert: any) {
    const newAlertsObject: IChatAlertsResponse = cloneDeep(this.chatAlerts);
    const platform = this.platformForAlertType(type);

    newAlertsObject.settings[platform][type].messages.push(newAlert);

    this.updateChatAlerts(newAlertsObject);
    await this.$modal.hide(NEW_ALERT_MODAL_ID);
  }

  // calls to service methods
  updateChatAlerts(newAlertsObject: IChatAlertsResponse) {
    return this.chatbotApiService.updateChatAlerts(newAlertsObject);
  }
}

