import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import { IPollProfile } from 'services/chatbot';
import ChatbotPollProfile from './Poll/ChatbotPollProfile.vue';

@Component({
  components: {
    ChatbotPollProfile
  }
})
export default class ChatbotPoll extends ChatbotBase {

  profiles: IPollProfile[] = [];

  mounted() {
    this.profiles = [
      {
        id: 'a',
        options:[{
          name: 'Test',
          parameter: 'test'
        },
        {
          name: 'Test2',
          parameter: 'test2'
        }],
        timer: {
          duration: 120,
          enabled: false
        },
        title: 'What should I play?!'
      },
      {
        id: 'a',
        options:[{
          name: 'Test',
          parameter: 'test'
        },
        {
          name: 'Test2',
          parameter: 'test2'
        }],
        timer: {
          duration: 120,
          enabled: false
        },
        title: 'What should I play?'
      },
      {
        id: 'a',
        options:[{
          name: 'Test',
          parameter: 'test'
        },
        {
          name: 'Test2',
          parameter: 'test2'
        }],
        timer: {
          duration: 120,
          enabled: false
        },
        title: 'What should I play?'
      }
    ];
  }
}
