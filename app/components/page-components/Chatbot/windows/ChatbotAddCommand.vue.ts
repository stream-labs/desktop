import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import WTextInput from 'components/shared/widget-inputs/WTextInput.vue';
import WTextAreaInput from 'components/shared/widget-inputs/WTextAreaInput.vue';
import WListInput from 'components/shared/widget-inputs/WListInput.vue';

@Component({
  components: {
    WTextInput,
    WTextAreaInput,
    WListInput
  }
})
export default class ChatbotAddCommand extends ChatbotWindowsBase {
  tabs: { name: String; value: String }[] = [
    {
      name: 'General',
      value: 'general'
    },
    {
      name: 'Advanced',
      value: 'advanced'
    }
  ];

  selectedTab: String = 'general';

  onSelectTab(tab: String) {
    this.selectedTab = tab;
  }
}
