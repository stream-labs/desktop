import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop } from 'vue-property-decorator';
import ChatbotVoteTracker from './ChatbotVoteTracker.vue';
import { throttle } from 'lodash-decorators';
import * as _ from 'lodash';

@Component({
  components: { ChatbotVoteTracker }
})
export default class ChatbotActivePoll extends ChatbotBase {
  open() {
    this.chatbotApiService.Poll.openPoll();
  }

  close() {
    this.chatbotApiService.Poll.closePoll();
  }

  cancel() {
    this.chatbotApiService.Poll.cancelPoll();
  }

  complete() {
    this.chatbotApiService.Poll.completePoll();
  }

  get isPollOpen() {
    return (
      this.chatbotApiService.Poll.state.activePollResponse.status === 'Open'
    );
  }

  get hasAnyVotes() {
    return (
      _.sumBy(
        this.chatbotApiService.Poll.state.activePollResponse.settings.options,
        'votes'
      ) > 0
    );
  }

  get total() {
    return _.sumBy(this.activePoll.settings.options, 'votes');
  }

  get activePoll() {
    return this.chatbotApiService.Poll.state.activePollResponse;
  }
}
