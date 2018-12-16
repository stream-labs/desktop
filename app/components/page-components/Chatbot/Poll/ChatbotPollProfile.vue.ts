import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop } from 'vue-property-decorator';
import { IPollProfile } from 'services/chatbot';
import moment from 'moment';
import * as _ from 'lodash';

@Component({})
export default class ChatbotPollProfile extends ChatbotBase {
  @Prop()
  profile: IPollProfile;

  mounted() {
  }

  formatTime(secs: number){
    return moment.utc(secs*1000).format('HH:mm:ss');
  }

  get options(){
    return _.map(this.profile.options,'name').join(', ');
  }

  onEditProfileHandler(){
    this.chatbotApiService.Common.openPollProfileWindow(this.profile);
  }

  onDeleteProfileHandler(){
    this.chatbotApiService.Poll.deletePollProfile(this.profile);
  }

  onStartPollHandler(){
    this.chatbotApiService.Poll.startPoll(this.profile);
  }
}
