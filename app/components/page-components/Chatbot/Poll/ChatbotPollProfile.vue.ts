import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop } from 'vue-property-decorator';
import { IPollProfile } from 'services/chatbot';
import moment from 'moment';

@Component({})
export default class ChatbotPollProfile extends ChatbotBase {
  @Prop()
  profile: IPollProfile;

  mounted() {
  }

  formatTime(secs: number){
    return moment.utc(secs*1000).format('HH:mm:ss');
  }
}
