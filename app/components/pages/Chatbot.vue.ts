import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import BrowserFrame from 'components/shared/BrowserFrame.vue';
import { UserService } from 'services/user';

@Component({
  components: {
    BrowserFrame,
  },
})
export default class Chatbot extends Vue {
  @Inject() userService: UserService;

  get partition() {
    return this.userService.state.auth.partition;
  }

  get url() {
    return this.userService.dashboardUrl('cloudbot', true);
  }
}
