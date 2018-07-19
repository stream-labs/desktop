import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ChatbotApiService } from 'services/chatbot-api';
import { Inject } from 'util/injector';

@Component({})
export default class ChatbotCommandsBase extends Vue {
  @Inject() chatbotApiService: ChatbotApiService;
}
