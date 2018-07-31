import _ from 'lodash';
import { Component } from 'vue-property-decorator';
import ChatbotAlertsBase from 'components/page-components/Chatbot/module-bases/ChatbotAlertsBase.vue';
import NavItem from 'components/shared/NavItem.vue';
import NavMenu from 'components/shared/NavMenu.vue';
import ChatbotNewAlertModalWindow from 'components/page-components/Chatbot/windows/ChatbotNewAlertModalWindow.vue';
import DropdownMenu from 'components/shared/DropdownMenu.vue';

import {
  ChatAlertsResponse
} from 'services/chatbot/chatbot-interfaces';

@Component({
  components: {
    NavMenu,
    NavItem,
    ChatbotNewAlertModalWindow,
    DropdownMenu
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

  isEnabled(type: string) {
    return this.alertTypes[type][this.typeKeys(type).enabled];
  }

  showNewChatAlertWindow() {
    this.$modal.show('new-alert', {
      onSubmit: (newAlert: any) => {
        debugger;
        this.addNewAlert(this.selectedType, newAlert);
      }
    });
  }

  onEdit(message: any, tier: string, index: number) {
    this.$modal.show('new-alert', {
      editedAlert: {
        ...message,
        tier
      },
      onSubmit: (updatedAlert: any) => {
        if (updatedAlert.tier !== tier && this.selectedType === 'subscriptions') {
          // moving tiers in twitch subscriptions
          const newAlertsObject: ChatAlertsResponse = _.cloneDeep(this.chatAlerts);
          const { parent, messages } = this.typeKeys(this.selectedType);

          // delete it from old tier
          newAlertsObject.settings[parent][messages][tier].splice(index, 1);
          // add to new tier
          newAlertsObject.settings[parent][messages][updatedAlert.tier].push(updatedAlert);

          this._updateChatAlerts(newAlertsObject).then(() => {
            this.$modal.hide('new-alert');
          });
          return;
        }

        this.spliceAlertMessages(
          this.selectedType,
          index,
          updatedAlert,
          tier
        );
      }
    });
  }

  onDelete(tier: string, index: number) {
    this.spliceAlertMessages(this.selectedType, index, null, tier);
  }

  onDone() {
    this.chatbotCommonService.closeChildWindow();
  }

  // filters
  formatTextBasedOnType(value: any) {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value === true ? 'Yes' : 'No';
  }

  formatTextFromSnakeCase(text: string) {
    if (!text) return '';
    return text.split('_').join(' ');
  }

  formatNumber(value: any, dp?: number) {
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
