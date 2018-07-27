import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import ChatbotAlertsBase from 'components/page-components/Chatbot/module-bases/ChatbotAlertsBase.vue';

@Component({})
export default class ChatbotNewAlertModalWindow extends ChatbotAlertsBase {
  @Prop() selectedType: string;

  get title() {
    return `New ${this.selectedType} Alert`;
  }
}