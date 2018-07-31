import { cloneDeep } from 'lodash';
import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import {
  IChatAlertsResponse
} from 'services/chatbot/chatbot-interfaces';
import { debug } from 'util';

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
    }
    delete alertTypes.bits;
    return alertTypes;
  }

  platformForAlertType(type: string) {
    if (type === 'tip') return 'streamlabs';
    return 'twitch';
  }


  // preparing data to send to service

  // update/delete alert
  spliceAlertMessages(
    type: string,
    index: number,
    updatedAlert: any,
    tier?: string
  ) {
      const newAlertsObject: IChatAlertsResponse = cloneDeep(this.chatAlerts);
      const platform = this.platformForAlertType(type);

      newAlertsObject.settings[platform][type].messages.splice(index, 1);
      if (updatedAlert) {
        newAlertsObject.settings[platform][type].messages.splice(index, 0, updatedAlert);
      }

      // ideally want to do spread operater splice(...spliceArgs)
      // let spliceArgs = [index, 1];
      // if (updatedAlert) spliceArgs.push(updatedAlert);

      // but TS doesnt like it
      // https://github.com/Microsoft/TypeScript/issues/4130

      this.updateChatAlerts(newAlertsObject).then(() => {
        this.$modal.hide('new-alert');
      });
    }

  // toggle enable type
  toggleEnableAlert(type: string) {
    const newAlertsObject: IChatAlertsResponse = cloneDeep(this.chatAlerts);
    const platform = this.platformForAlertType(type);

    newAlertsObject.settings[platform][type].enabled = !this.chatAlerts.settings[platform][type].enabled;
    this.updateChatAlerts(newAlertsObject);
  }

  // add new alert
  addNewAlert(type: string, newAlert: any) {
    const newAlertsObject: IChatAlertsResponse = cloneDeep(this.chatAlerts);
    const platform = this.platformForAlertType(type);

    newAlertsObject.settings[platform][type].messages.push(newAlert);

    this.updateChatAlerts(newAlertsObject).then(() => {
      this.$modal.hide('new-alert');
    });
  }

  // calls to service methods
  updateChatAlerts(newAlertsObject: IChatAlertsResponse) {
    return this.chatbotApiService.updateChatAlerts(newAlertsObject);
  }

}

