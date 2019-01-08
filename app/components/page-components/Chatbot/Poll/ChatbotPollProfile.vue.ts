import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop } from 'vue-property-decorator';
import { IPollProfile, DELETE_MODAL, ChatbotSettingSlug, IBettingProfile } from 'services/chatbot';
import moment from 'moment';
import * as _ from 'lodash';
import ChatbotGenericModalWindow from '../windows/ChatbotGenericModalWindow.vue';
import ChatbotVoteTracker from './ChatbotVoteTracker.vue';

@Component({
  components: { ChatbotGenericModalWindow, ChatbotVoteTracker },
})
export default class ChatbotPollProfile extends ChatbotBase {
  @Prop() profile: IPollProfile | IBettingProfile;
  @Prop({ default: 'poll' }) type: ChatbotSettingSlug;

  formatTime(secs: number) {
    return moment.utc(secs * 1000).format('HH:mm:ss');
  }

  get options() {
    return _.map(this.profile.options, 'name').join(', ');
  }

  get timeRemaining() {
    if (this.type === 'poll') {
      if (this.isActive) {
        return this.chatbotApiService.Poll.state.timeRemaining;
      }
      return this.profile.timer.enabled ? this.formatTime(this.profile.timer.duration) : '-';
    }

    if (this.isActive) {
      return this.chatbotApiService.Betting.state.timeRemaining;
    }
    return this.profile.timer.enabled ? this.formatTime(this.profile.timer.duration) : '-';
  }

  get DELETE_MODAL() {
    return DELETE_MODAL;
  }

  get isActive() {
    if (this.type === 'poll') {
      const activePoll = this.chatbotApiService.Poll.state.activePollResponse;
      return (
        this.profile &&
        activePoll &&
        activePoll.settings &&
        activePoll.settings.id === this.profile.id
      );
    }

    const activeBet = this.chatbotApiService.Betting.state.activeBettingResponse;
    return (
      this.profile && activeBet && activeBet.settings && activeBet.settings.id === this.profile.id
    );
  }

  get isOpen() {
    if (this.type === 'poll') {
      return this.chatbotApiService.Poll.state.activePollResponse.id != null;
    }
    return this.chatbotApiService.Betting.state.activeBettingResponse.id != null;
  }

  get topThreeOptions() {
    if (this.type === 'poll') {
      const active = this.chatbotApiService.Poll.state.activePollResponse;
      return _.orderBy(active.settings.options.slice(0, 5), 'votes', 'desc');
    }

    const active = this.chatbotApiService.Betting.state.activeBettingResponse;
    return _.orderBy(active.settings.options.slice(0, 5), 'bets', 'desc');
  }

  onEditProfileHandler() {
    if (this.type === 'poll') {
      this.chatbotApiService.Common.openPollProfileWindow(this.profile);
    }
    this.chatbotApiService.Common.openBettingProfileWindow(this.profile as IBettingProfile);
  }

  onDeleteProfileHandler() {
    this.$modal.show(this.DELETE_MODAL);
    this.chatbotApiService.Common.closeChatbotChildWindow();
  }

  onStartHandler() {
    if (this.type === 'poll') {
      this.chatbotApiService.Poll.startPoll(this.profile);
    } else {
      this.chatbotApiService.Betting.start(this.profile as IBettingProfile);
    }
  }

  onViewActiveHandler() {
    if (this.type === 'poll') {
      this.chatbotApiService.Poll.changeView('active');
    } else {
      this.chatbotApiService.Betting.changeView('active');
    }
  }

  onYesHandler() {
    if (this.type === 'poll') {
      this.chatbotApiService.Poll.deletePollProfile(this.profile);
    } else {
      this.chatbotApiService.Betting.deleteProfile(this.profile as IBettingProfile);
    }
  }

  onNoHandler() {
    return;
  }
}
