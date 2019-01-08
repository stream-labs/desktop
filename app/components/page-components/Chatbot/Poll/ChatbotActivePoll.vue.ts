import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop } from 'vue-property-decorator';
import ChatbotVoteTracker from './ChatbotVoteTracker.vue';
import * as _ from 'lodash';
import ChatbotGenericModalWindow from '../windows/ChatbotGenericModalWindow.vue';
import { ChatbotSettingSlug } from 'services/chatbot';

@Component({
  components: { ChatbotVoteTracker, ChatbotGenericModalWindow },
})
export default class ChatbotActivePoll extends ChatbotBase {
  @Prop({ default: 'poll' })
  type: ChatbotSettingSlug;

  get isOpen() {
    if (this.type === 'poll') {
      return this.chatbotApiService.Poll.state.activePollResponse.status === 'Open';
    }
    return this.chatbotApiService.Betting.state.activeBettingResponse.status === 'Open';
  }

  get isCancelable() {
    if (this.type === 'poll') {
      return (
        _.sumBy(this.chatbotApiService.Poll.state.activePollResponse.settings.options, 'votes') ===
        0
      );
    }
    return this.chatbotApiService.Betting.state.activeBettingResponse.status !== 'Picked';
  }

  get isPicked() {
    if (this.type === 'poll') {
      return false;
    }
    return this.chatbotApiService.Betting.state.activeBettingResponse.status === 'Picked';
  }

  get total() {
    if (this.type === 'poll') {
      return _.sumBy(this.active.settings.options, 'votes');
    }
    return _.sumBy(this.active.settings.options, 'bets');
  }

  get loyalty() {
    return _.sumBy(this.active.settings.options, 'loyalty');
  }

  get active() {
    if (this.type === 'poll') {
      return this.chatbotApiService.Poll.state.activePollResponse;
    }
    return this.chatbotApiService.Betting.state.activeBettingResponse;
  }

  get CANCEL_MODAL() {
    return 'cancel-poll';
  }

  get timeRemaining() {
    if (this.type === 'poll') {
      return this.chatbotApiService.Poll.state.timeRemaining;
    }
    return this.chatbotApiService.Betting.state.timeRemaining;
  }

  mounted() {
    console.log('--TYPE--');
    console.log(this.type);

    this.onToggleStateHandler = _.throttle(this.onToggleStateHandler, 1000);
    this.onCancelHandler = _.throttle(this.onCancelHandler, 1000);
    this.onCompleteHandler = _.throttle(this.onCompleteHandler, 1000);
  }

  onToggleStateHandler() {
    if (this.type === 'poll') {
      if (this.active.status === 'Open') {
        this.chatbotApiService.Poll.closePoll();
      } else {
        this.chatbotApiService.Poll.openPoll();
      }
    } else {
      if (this.active.status === 'Open') {
        this.chatbotApiService.Betting.close();
      } else {
        this.chatbotApiService.Betting.open();
      }
    }
  }

  onCancelHandler() {
    this.$modal.show(this.CANCEL_MODAL);
    this.chatbotApiService.Common.closeChatbotChildWindow();
  }

  onCompleteHandler() {
    if (this.type === 'poll') {
      this.chatbotApiService.Poll.completePoll();
    } else {
      this.chatbotApiService.Betting.complete();
    }
  }

  onBackHandler() {
    if (this.type === 'poll') {
      this.chatbotApiService.Poll.changeView('profiles');
    } else {
      this.chatbotApiService.Betting.changeView('profiles');
    }
  }

  onYesCancelHandler() {
    if (this.type === 'poll') {
      this.chatbotApiService.Poll.cancelPoll();
    } else {
      this.chatbotApiService.Betting.cancel();
    }
  }

  onNoCancelHandler() {
    return;
  }
}
