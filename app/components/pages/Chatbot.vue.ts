import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services';
import { UserService } from 'services/user';
import WebviewLoader from 'components/WebviewLoader.vue';

@Component({
  components: { WebviewLoader },
})
export default class Chatbot extends Vue {
  @Inject() userService: UserService;

  get chatbotUrl() {
    return this.userService.dashboardUrl('cloudbot', true);
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }
}
