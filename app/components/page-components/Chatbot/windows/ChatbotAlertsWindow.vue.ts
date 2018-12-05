import {cloneDeep} from 'lodash';
import { Component } from 'vue-property-decorator';
import ChatbotAlertsBase from 'components/page-components/Chatbot/module-bases/ChatbotAlertsBase.vue';
import NavItem from 'components/shared/NavItem.vue';
import NavMenu from 'components/shared/NavMenu.vue';
import ChatbotNewAlertModalWindow from 'components/page-components/Chatbot/windows/ChatbotNewAlertModalWindow.vue';
import { $t } from 'services/i18n';

import {
  IAlertMessage,
  ChatbotAlertType,
  NEW_ALERT_MODAL_ID
} from 'services/chatbot';

@Component({
  components: {
    NavMenu,
    NavItem,
    ChatbotNewAlertModalWindow
  }
})
export default class ChatbotAlertsWindow extends ChatbotAlertsBase {
  selectedType: ChatbotAlertType = 'tip';

  get selectedTypeData() {
    return this.alertTypes[this.selectedType];
  }

  get selectedTypeMessages() {
    return this.selectedTypeData.messages;
  }

  get selectedTypeTableTitles() {
    return Object.keys(this.selectedTypeMessages);
  }

  get selectedTypeTableColumns() {
    const message = this.selectedTypeMessages[0];
    if (message) return Object.keys(message);

    return [];
  }

  alertTypeFormattedName(type: ChatbotAlertType) {
    if (type === 'tip') return 'donation';
    if (type === 'sub_mystery_gift') return 'sub mystery gift';
    if (type === 'sponsor') return 'member';
    return type;
  };

  isEnabled(type: ChatbotAlertType) {
    return this.alertTypes[type].enabled;
  }

  onShowNewChatAlertWindowHandler() {
    this.$modal.show(NEW_ALERT_MODAL_ID, {
      onSubmitHandler: (newAlert: IAlertMessage) => {
        this.addNewAlert(this.selectedType, newAlert);
      }
    });
  }

  onEditHandler(message: IAlertMessage, index: number) {
    this.$modal.show(NEW_ALERT_MODAL_ID, {
      editedAlert: message,
      onSubmitHandler: (updatedAlert: IAlertMessage) => {
        this.spliceAlertMessages(this.selectedType, index, updatedAlert);
      }
    });
  }

  onDeleteHandler(index: number) {
    this.spliceAlertMessages(this.selectedType, index, null);
  }

  onDoneHandler() {
    this.chatbotApiService.Common.closeChildWindow();
  }

  onResetHandler() {
    if (
      confirm(
        $t('Are you sure you want to reset chatbot notifications preferences?')
      )
    ) {
      this.chatbotApiService.Alerts.resetSettings();
    }
  }

  // filters
  formatNumber(value: number, dp = 0) {
    if (isNaN(Number(value))) {
      return value;
    }

    return value.toLocaleString(undefined, {
      maximumFractionDigits: dp,
      minimumFractionDigits: dp
    });
  }

  formatHeader(column: string) {
    switch (column) {
      case 'is_gifted':
        return 'is gifted';
      default:
        return column;
    }
  }

  formatValue(value: any, column: string) {
    switch (column) {
      case 'amount':
        const dp = this.selectedType === 'tip' ? 2 : 0;
        return this.formatNumber(value, dp);
      case 'message':
        return value;
      case 'is_gifted':
        return value === true ? $t('Yes') : $t('No');
      default:
        return value;
    }
  }
}
