import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop } from 'vue-property-decorator';
import { IPollProfile, DELETE_MODAL } from 'services/chatbot';
import moment from 'moment';
import * as _ from 'lodash';
import ChatbotGenericModalWindow from '../windows/ChatbotGenericModalWindow.vue';

@Component({
  components: { ChatbotGenericModalWindow }
})
export default class ChatbotPollProfile extends ChatbotBase {
  @Prop() profile: IPollProfile;

  mounted() {}

  formatTime(secs: number) {
    return moment.utc(secs * 1000).format('HH:mm:ss');
  }

  get options() {
    return _.map(this.profile.options, 'name').join(', ');
  }

  get DELETE_MODAL() {
    return DELETE_MODAL;
  }

  onEditProfileHandler() {
    this.chatbotApiService.Common.openPollProfileWindow(this.profile);
  }

  onDeleteProfileHandler() {
    this.$modal.show(this.DELETE_MODAL);
    this.chatbotApiService.Common.closeChatbotChildWindow();
  }

  onStartPollHandler() {
    this.chatbotApiService.Poll.startPoll(this.profile);
  }

  onYesHandler() {
    this.chatbotApiService.Poll.deletePollProfile(this.profile);
  }

  onNoHandler() {
    return;
  }
}
