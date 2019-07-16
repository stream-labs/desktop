import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services';
import { UserService } from 'services/user';
import BrowserView from 'components/shared/BrowserView';

@Component({
  components: { BrowserView },
})
export default class Chatbot extends Vue {
  @Inject() userService: UserService;

  get chatbotUrl() {
    return this.userService.dashboardUrl('cloudbot', true);
  }
}
