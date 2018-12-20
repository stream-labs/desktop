import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop } from 'vue-property-decorator';
import { IPollOption } from 'services/chatbot';
import * as _ from 'lodash';

@Component({})
export default class ChatbotVoteTracker extends ChatbotBase {
  @Prop() option: IPollOption;

  get percentage() {
    return `${(this.votes / Math.max(this.total,1) * 100).toFixed(2)}%`;
  }

  get command() {
    return this.settings.commands['vote'].command + ' ' + this.option.parameter;
  }
  
  get name() {
    return this.option.name;
  }

  get votes() {
    return this.option.votes;
  }

  get total() {
    return _.sumBy(this.activePollSettings.options, 'votes');
  }

  get settings() {
    return this.chatbotApiService.Poll.state.pollPreferencesResponse.settings;
  }

  get activePollSettings() {
    return this.chatbotApiService.Poll.state.activePollResponse.settings;
  }
}
