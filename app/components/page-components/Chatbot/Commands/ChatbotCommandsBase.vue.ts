import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ChatbotApiService } from 'services/chatbot/chatbot-api';
import { Inject } from 'util/injector';
import WToggleInput from 'components/shared/widget-inputs/WToggleInput.vue';

@Component({
  components: {
    WToggleInput,
  }
})
export default class ChatbotCommandsBase extends Vue {
  @Inject() chatbotApiService: ChatbotApiService;
}
