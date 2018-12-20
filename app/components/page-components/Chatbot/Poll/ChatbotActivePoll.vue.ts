import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import ChatbotVoteTracker from './ChatbotVoteTracker.vue';
import * as _ from 'lodash';
import ChatbotGenericModalWindow from '../windows/ChatbotGenericModalWindow.vue';
import * as moment from 'moment';
import { throttle } from 'lodash-decorators';

@Component({
  components: { ChatbotVoteTracker, ChatbotGenericModalWindow }
})
export default class ChatbotActivePoll extends ChatbotBase {
  timer: number = null;
  timeRemaining: string = '00:00:00';

  mounted() {
    this.updateTimer();
    this.timer = setInterval(this.updateTimer, 1000) as any;
    this.toggleState = _.throttle(this.toggleState, 1000);
    this.cancel = _.throttle(this.cancel, 1000);
    this.complete = _.throttle(this.complete, 1000);
  }

  destroyed() {
    clearInterval(this.timer);
  }

  toggleState() {
    if (this.activePoll.status === 'Open') {
      this.chatbotApiService.Poll.closePoll();
    } else {
      this.chatbotApiService.Poll.openPoll();
    }
  }

  cancel() {
    this.$modal.show(this.CANCEL_MODAL);
    this.chatbotApiService.Common.closeChatbotChildWindow();
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

  get CANCEL_MODAL() {
    return 'cancel-poll';
  }

  onYesCancelHandler() {
    this.chatbotApiService.Poll.cancelPoll();
  }

  onNoCancelHandler() {
    return;
  }

  updateTimer() {
    if (this.activePoll.settings.timer.enabled && this.activePoll.settings.timer.started_at) {
      const timeElapsed = Date.now() - this.activePoll.settings.timer.started_at;
      const timerLength = this.activePoll.settings.timer.time_remaining * 1000;

      const duration = moment.duration(Math.max(0, timerLength - timeElapsed));
      this.timeRemaining = moment
        .utc(duration.asMilliseconds())
        .format('HH:mm:ss');
    } else if(!this.activePoll.settings.timer.enabled){
      
      const timeElapsed = Date.now() - Date.parse(this.activePoll.created_at);
      const duration = moment.duration(Math.max(0, timeElapsed));
      this.timeRemaining = moment
        .utc(duration.asMilliseconds())
        .format('HH:mm:ss');
    }
  }
}
