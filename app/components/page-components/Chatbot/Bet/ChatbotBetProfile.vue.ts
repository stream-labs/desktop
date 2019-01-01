import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop } from 'vue-property-decorator';
import {  DELETE_MODAL, IBettingProfile } from 'services/chatbot';
import moment from 'moment';
import * as _ from 'lodash';
import ChatbotGenericModalWindow from '../windows/ChatbotGenericModalWindow.vue';
import ChatbotVoteTracker from './ChatbotBetTracker.vue';

@Component({
  components: { ChatbotGenericModalWindow, ChatbotVoteTracker }
})
export default class ChatbotBetProfile extends ChatbotBase {
  @Prop() profile: IBettingProfile;

  formatTime(secs: number) {
    return moment.utc(secs * 1000).format('HH:mm:ss');
  }

  get options() {
    return _.map(this.profile.options, 'name').join(', ');
  }

  get timeRemaining() {
    if (this.isActiveBet) {
      return this.chatbotApiService.Betting.state.timeRemaining;
    } else {
      return this.profile.timer.enabled
        ? this.formatTime(this.profile.timer.duration)
        : '-';
    }
  }

  get DELETE_MODAL() {
    return DELETE_MODAL;
  }

  get isActiveBet() {
    const activeBet = this.chatbotApiService.Betting.state.activeBettingResponse;
    return (
      this.profile &&
      activeBet &&
      activeBet.settings &&
      activeBet.settings.id === this.profile.id
    );
  }

  get isBetingOpen() {
    return this.chatbotApiService.Betting.state.activeBettingResponse.id != null;
  }

  get topThreeOptions() {
    const active = this.chatbotApiService.Betting.state.activeBettingResponse;
    return _.orderBy(active.settings.options.slice(0, 5), 'votes', 'desc');
  }

  onEditProfileHandler() {
    this.chatbotApiService.Common.openPollProfileWindow(this.profile);
  }

  onDeleteProfileHandler() {
    this.$modal.show(this.DELETE_MODAL);
    this.chatbotApiService.Common.closeChatbotChildWindow();
  }

  onStartBettingHandler() {
    this.chatbotApiService.Betting.start(this.profile);
  }

  onViewActiveHandler() {
    this.chatbotApiService.Betting.changeView('active');
  }

  onYesHandler() {
    this.chatbotApiService.Betting.deleteProfile(this.profile);
  }

  onNoHandler() {
    return;
  }
}
