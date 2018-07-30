import _ from 'lodash';
import { Component } from 'vue-property-decorator';
import ChatbotAlertsBase from 'components/page-components/Chatbot/module-bases/ChatbotAlertsBase.vue';
import NavItem from 'components/shared/NavItem.vue';
import NavMenu from 'components/shared/NavMenu.vue';
import ChatbotNewAlertModalWindow from 'components/page-components/Chatbot/windows/ChatbotNewAlertModalWindow.vue';
import DropdownMenu from 'components/shared/DropdownMenu.vue';

@Component({
  components: {
    NavMenu,
    NavItem,
    ChatbotNewAlertModalWindow,
    DropdownMenu
  },
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
    this.$modal.show('new-alert');
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
