import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import ChatbotVoteTracker from './ChatbotBetTracker.vue';
import * as _ from 'lodash';
import ChatbotGenericModalWindow from '../windows/ChatbotGenericModalWindow.vue';
import * as moment from 'moment';

@Component({
  components: { ChatbotVoteTracker, ChatbotGenericModalWindow }
})
export default class ChatbotActiveBet extends ChatbotBase {
  get isBettingOpen() {
    return (
      this.chatbotApiService.Betting.state.activeBettingResponse.status === 'Open'
    );
  }

  get hasAnyVotes() {
    return (
      _.sumBy(
        this.chatbotApiService.Betting.state.activeBettingResponse.settings.options,
        'bets'
      ) > 0
    );
  }

  get total() {
    return _.sumBy(this.activeBet.settings.options, 'bets');
  }

  get activeBet() {
    return this.chatbotApiService.Betting.state.activeBettingResponse;
  }

  get CANCEL_MODAL() {
    return 'cancel-bet';
  }

  get timeRemaining() {
    return this.chatbotApiService.Betting.state.timeRemaining;
  }

  mounted() {
    this.onToggleStateHandler = _.throttle(this.onToggleStateHandler, 1000);
    this.onCancelHandler = _.throttle(this.onCancelHandler, 1000);
    this.onCompleteHandler = _.throttle(this.onCompleteHandler, 1000);
  }

  onToggleStateHandler() {
    if (this.activeBet.status === 'Open') {
      this.chatbotApiService.Betting.close();
    } else {
      this.chatbotApiService.Betting.open();
    }
  }

  onCancelHandler() {
    this.$modal.show(this.CANCEL_MODAL);
    this.chatbotApiService.Common.closeChatbotChildWindow();
  }

  onCompleteHandler() {
    this.chatbotApiService.Betting.complete();
  }

  onBackHandler() {
    this.chatbotApiService.Betting.changeView('profiles');
  }

  onYesCancelHandler() {
    this.chatbotApiService.Betting.cancel();
  }

  onNoCancelHandler() {
    return;
  }
}
