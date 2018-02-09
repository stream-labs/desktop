import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';

@Component({})
export default class Dashboard extends Vue {
  @Inject() userService: UserService;

  @Prop() params: Dictionary<string>;

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  subPage: String = '';

  get dashboardUrl() {
    const url = this.userService.dashboardUrl(this.params.subPage);
    return url;
  }
}
