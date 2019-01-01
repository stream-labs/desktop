import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop } from 'vue-property-decorator';
import * as _ from 'lodash';
import { IBettingOption } from 'services/chatbot';

@Component({})
export default class ChatbotBetTracker extends ChatbotBase {
  @Prop() option: IBettingOption;
  @Prop({default: false}) thinBars: boolean;

  get percentage() {
    return `${(this.bets / Math.max(this.total,1) * 100).toFixed(2)}%`;
  }

  get command() {
    return this.settings.commands['vote'].command + ' ' + this.option.parameter;
  }
  
  get name() {
    return this.option.name;
  }

  get bets() {
    return this.option.bets;
  }

  get total() {
    return _.sumBy(this.activeBettingSettings.options, 'bets');
  }

  get settings() {
    return this.chatbotApiService.Betting.state.bettingPreferencesResponse.settings;
  }

  get activeBettingSettings() {
    return this.chatbotApiService.Betting.state.activeBettingResponse.settings;
  }
}
