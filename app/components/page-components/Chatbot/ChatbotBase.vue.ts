import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ChatbotApiService, ChatbotCommonService } from 'services/chatbot/chatbot';
import { Inject } from 'util/injector';
import ToggleInput from 'components/shared/inputs/ToggleInput.vue';
import Tabs from 'components/Tabs.vue';

@Component({
  components: {
    ToggleInput,
    Tabs,
  }
})
export default class ChatbotBase extends Vue {
  @Inject() chatbotApiService: ChatbotApiService;
  @Inject() chatbotCommonService: ChatbotCommonService;
}
