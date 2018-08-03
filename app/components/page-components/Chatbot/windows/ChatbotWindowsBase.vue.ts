import Vue from 'vue';
import { Component, Inject } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import ModalLayout from 'components/ModalLayout.vue';
import windowMixin from 'components/mixins/window';
import VModal from 'vue-js-modal';

Vue.use(VModal);

@Component({
  components: {
    ModalLayout,
  },
  mixins: [windowMixin]
})
export default class ChatbotWindowsBase extends ChatbotBase {}
