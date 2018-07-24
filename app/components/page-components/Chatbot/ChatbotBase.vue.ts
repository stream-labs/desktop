import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ChatbotApiService, ChatbotCommonService } from 'services/chatbot/chatbot';
import { Inject } from 'util/injector';
import WToggleInput from 'components/shared/widget-inputs/WToggleInput.vue';
import Tabs from 'components/Tabs.vue';

@Component({
  components: {
    WToggleInput,
    Tabs,
  }
})
export default class ChatbotBase extends Vue {
  @Inject() chatbotApiService: ChatbotApiService;
  @Inject() chatbotCommonService: ChatbotCommonService;
}
