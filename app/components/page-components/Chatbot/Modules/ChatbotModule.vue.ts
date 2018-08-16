import { Component, Prop } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { IChatbotModule } from 'services/chatbot/chatbot-interfaces';

@Component({})
export default class ChatbotModule extends ChatbotBase {
  @Prop() chatbotModule: IChatbotModule;
}
