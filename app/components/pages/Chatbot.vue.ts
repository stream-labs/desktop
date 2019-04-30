import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { UserService } from 'services/user';

@Component({})
export default class Chatbot extends Vue {
  @Inject() userService: UserService;

  get chatbotUrl() {
    return this.userService.dashboardUrl('cloudbot', true);
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }
}
