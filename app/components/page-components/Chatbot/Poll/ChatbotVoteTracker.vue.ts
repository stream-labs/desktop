import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop } from 'vue-property-decorator';
import {
  IPollOption,
  ChatbotSettingSlug,
  IBettingOption
} from 'services/chatbot';
import * as _ from 'lodash';

@Component({})
export default class ChatbotVoteTracker extends ChatbotBase {
  @Prop() option: IPollOption | IBettingOption;
  @Prop({ default: false })
  thinBars: boolean;
  @Prop({ default: 'poll' })
  type: ChatbotSettingSlug;

  get percentage() {
    return `${(this.amount / Math.max(this.total, 1) * 100).toFixed(2)}%`;
  }

  get command() {
    if (this.type === 'poll') {
      return (
        this.settings.commands['vote'].command + ' ' + this.option.parameter
      );
    } else {
      return (
        this.settings.commands['bet'].command + ' ' + this.option.parameter
      );
    }
  }

  get isPicked() {
    if (this.type === 'poll') {
      return false;
    } else {
      return (
        this.chatbotApiService.Betting.state.activeBettingResponse.status ===
        'Picked'
      );
    }
  }

  get isClosed(){
    return (
      this.chatbotApiService.Betting.state.activeBettingResponse.status ===
      'Closed'
    );
  }

  get name() {
    return this.option.name;
  }

  get amount() {
    if (this.type === 'poll') {
      return this.option['votes'];
    } else {
      return this.option['bets'];
    }
  }

  get loyalty() {
    if (this.type === 'poll') {
      return 0;
    } else {
      return this.option['loyalty'];
    }
  }

  get total() {
    if (this.type === 'poll') {
      return _.sumBy(this.activeSettings.options, 'votes');
    } else {
      return _.sumBy(this.activeSettings.options, 'bets');
    }
  }

  get settings() {
    if (this.type === 'poll') {
      return this.chatbotApiService.Poll.state.pollPreferencesResponse.settings;
    } else {
      return this.chatbotApiService.Betting.state.bettingPreferencesResponse
        .settings;
    }
  }

  get activeSettings() {
    if (this.type === 'poll') {
      return this.chatbotApiService.Poll.state.activePollResponse.settings;
    } else {
      return this.chatbotApiService.Betting.state.activeBettingResponse
        .settings;
    }
  }

  onPickWinnerHandler(){
    this.chatbotApiService.Betting.pickWinner(this.option.parameter);
    
  }
}
